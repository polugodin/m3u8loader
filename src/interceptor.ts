import { EventEmitter } from 'events'

class MediaElementsStore<T> {
  private store: Set<T>
  constructor() {
    this.store = new Set()
  }
  add(element: T) {
    this.store.add(element)
  }
  grab(predicate: (item: T) => boolean) {
    for (const item of this.store) {
      if (predicate(item)) {
        this.store.delete(item)
        return item
      }
    }
  }
}

export declare interface MediaEmitter<T> {
  on(event: 'chunk', listener: (data: Uint8Array, endDTS: number) => void): this
  on(event: 'done', listener: () => void): this
  on(event: 'meta', listener: (mimeType: string, duration: number) => void): this
  chunk(data: Uint8Array, endDTS: number): void
  done(): void
  meta(mimeType: string, duration: number): void
}
export class MediaEmitter<T> extends EventEmitter {
  constructor(readonly element: T) {
    super()
  }
  chunk(data: Uint8Array, endDTS: number) {
    this.emit('chunk', data, endDTS)
  }
  done() {
    this.emit('done')
  }
  meta(mimeType: string, duration: number) {
    this.emit('meta', mimeType, duration)
  }
}

export const mediaElementsStore: MediaElementsStore<MediaEmitter<HTMLMediaElement>> =
  new MediaElementsStore()
const objURLStore = new Map<MediaSource, string>()

class MediaSourceMock extends window.MediaSource {
  addSourceBuffer(mimeType: string): SourceBuffer {
    try {
      const sb = super.addSourceBuffer(mimeType)
      const mediaSource = this
      const objectURL = objURLStore.get(mediaSource)
      objURLStore.delete(mediaSource)
      const mediaEmitter = mediaElementsStore.grab((x) => x?.element?.src === objectURL)
      if (!objectURL || !mediaEmitter) {
        console.log('reverse search failed')
        return sb
      }
      console.log('reverse search found =>', mediaEmitter.element.src)

      mediaEmitter.meta(mimeType, mediaSource.duration)


      sb.appendBuffer = new Proxy(sb.appendBuffer, {
        apply(target, thisArg, args) {
          const data = args[0]
          Reflect.apply(target, thisArg, args)

          sb.addEventListener(
            'update',
            function () {
              mediaEmitter.element.currentTime = sb.timestampOffset - 9 // seek
              mediaEmitter.chunk(data, sb.timestampOffset) // <= new chunk recieved
              if (mediaSource.duration - sb.timestampOffset < 1) {
                sb.abort()
                mediaSource.endOfStream()
                mediaEmitter.done()
              }
            },
            { once: true }
          )
        },
      })

      return sb
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}

const URLProxy = {
  createObjectURL: new Proxy(window.URL.createObjectURL, {
    apply(target, thisArg, args) {
      const objectURL = Reflect.apply(target, thisArg, args)
      const mediaSource = args[0]
      // console.log('create obj url', mediaSource instanceof MediaSourceMock)
      if (mediaSource instanceof MediaSourceMock) {
        objURLStore.set(mediaSource, objectURL)
      }
      return objectURL
    },
  }),
  revokeObjectURL: new Proxy(URL.revokeObjectURL, {
    apply(target, thisArg, args) {
      // console.log('revoke obj url')
      return Reflect.apply(target, thisArg, args)
    },
  }),
}

const fakeURL = {
  ...window.URL,
  ...URLProxy,
}

window.MediaSource = MediaSourceMock
Object.assign(window.URL, fakeURL)
