import './index.scss'
import { mediaElementsStore, MediaEmitter } from './interceptor'
import Hls from 'hls.js'
import { parse } from './playlistParser'

if (!Hls.isSupported()) {
  throw new Error('Hls not supported')
}

const hls = new Hls()
const download = function (uri) {
  const mediaElement: HTMLMediaElement = document.createElement('video')

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

function savem3u8(uri: string) {
  const chunks = []
  let mimeType = ''
  let duration = 0
  return download(uri)
    .on('meta', (_mimeType, _duration) => {
      mimeType = _mimeType
      duration = _duration
      console.log(_mimeType, _duration)
    })
    .on('chunk', (data, endDTS) => {
      console.log('chunk', endDTS / duration)
      chunks.push(data)
    })
    .on('done', () => saveBlob(chunks, uri.split('').filter(c => /[\w-\.]/.test(c)).join('') + '.mp4', mimeType))
}

const getbtn = document.querySelector<HTMLButtonElement>('.getsource')
const playbtn = document.querySelector<HTMLButtonElement>('.playmedia')
const parsebtn = document.querySelector<HTMLButtonElement>('.parseplaylist')
const inputURI = document.querySelector<HTMLDivElement>('.inputm3u8')
const videotag = document.querySelector<HTMLMediaElement>('video')
inputURI.innerText = '/index.m3u8'
getbtn.onclick = () => {
  savem3u8(inputURI.innerText)
}
playbtn.onclick = () => {
  playMedia(videotag, inputURI.innerText)
}
parsebtn.onclick = () => {
  fetch(inputURI.innerText).then(r => r.text()).then(parse).then(playlistData => {
    const res = JSON.stringify(playlistData, (key, value) => {
      if (key === 'uri' && typeof value === 'string') {
        const match = inputURI.innerText.match(/.*\//i)
        const v = !match || value.startsWith('http') ? value : match[0] + value
        return `<a href=${v}>${v}</a>`
      }
      return value
    }, 2)
    const pre = document.querySelector<HTMLPreElement>('pre.parse-result')
    pre.innerHTML = res
    pre.querySelectorAll('a').forEach(a => {
      a.onclick = event => {
        event.preventDefault()
        inputURI.innerText = a.href
      }
    })
  })
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
