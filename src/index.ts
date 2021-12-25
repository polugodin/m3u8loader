import { mediaElementsStore, MediaEmitter } from './interceptor'
import Hls from 'hls.js'

if (!Hls.isSupported()) {
  throw new Error('Hls not supported')
}

const hls = new Hls()
const download = function (uri) {
  const mediaElement: HTMLMediaElement = document.createElement('audio')
  mediaElement.muted = true
  const mediaEmitter = new MediaEmitter<HTMLMediaElement>(mediaElement)
  mediaElementsStore.add(mediaEmitter)
  hls.attachMedia(mediaElement)
  hls.on(Hls.Events.MEDIA_ATTACHED, function () {
    hls.loadSource(uri)
    hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
      console.log('manifest loaded, found ' + data.levels.length + ' quality level')
    })
  })
  return mediaEmitter
}

function playMedia(tag: HTMLMediaElement, uri: string) {
  hls.attachMedia(tag)
  hls.on(Hls.Events.MEDIA_ATTACHED, function () {
    hls.loadSource(uri)
    hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
      console.log('manifest loaded, found ' + data.levels.length + ' quality level')
      tag.play()
    })
  })
}

function savem3u8(uri) {
  const chunks = []
  let mimeType = ''
  let duration = 0
  return download(uri)
    .on('meta', (_mimeType, _duration) => {
      mimeType = _mimeType
      duration = _duration
    })
    .on('chunk', (data, endDTS) => {
      console.log('chunk', endDTS / duration)
      chunks.push(data)
    })
    .on('done', () => saveBlob(chunks, Date.now() + '.mp3', mimeType))
}

const getbtn = document.querySelector<HTMLButtonElement>('.getsource')
const playbtn = document.querySelector<HTMLButtonElement>('.playmedia')
const input = document.querySelector<HTMLDivElement>('.inputm3u8')
const videotag = document.querySelector<HTMLMediaElement>('video')
input.innerText = '/media/index.m3u8'
getbtn.onclick = () => {
  savem3u8(input.innerText)
}
playbtn.onclick = () => {
  playMedia(videotag, input.innerText)
}

function saveBlob(chunks, fileName, mime) {
  const blob = new Blob(chunks, { type: mime })

  const objurl = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.download = fileName
  a.href = objurl
  a.click()

  URL.revokeObjectURL(objurl)
}
