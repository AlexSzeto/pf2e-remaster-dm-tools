const audioContext = new AudioContext()

export function createAudioSource(path, fadeInDuration, fadeToGain = 1.0) {
  let bufferSource = audioContext.createBufferSource()
  let gainNode = audioContext.createGain()

  bufferSource.connect(gainNode)
  gainNode.connect(audioContext.destination)

  let request = new XMLHttpRequest()
  request.open('GET', path, true)
  request.responseType = 'arraybuffer'

  request.onload = function () {
    let audioData = request.response
    audioContext.decodeAudioData(audioData, function (buffer) {
      bufferSource.buffer = buffer
      bufferSource.loop = true
      bufferSource.start(0)

      const currentTime = audioContext.currentTime
      gainNode.gain.setValueAtTime(0, currentTime)
      gainNode.gain.linearRampToValueAtTime(fadeToGain, currentTime + fadeInDuration)
    })
  }

  request.send()

  const end = (duration) => {
    const currentTime = audioContext.currentTime
    gainNode.gain.cancelScheduledValues(currentTime)
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
    gainNode.gain.linearRampToValueAtTime(0, currentTime + duration)

    // Schedule stop and cleanup after fade out completes
    setTimeout(function () {
      bufferSource.stop()
      bufferSource.disconnect()
      gainNode.disconnect()
      bufferSource = null
      gainNode = null
    }, (currentTime + duration) * 1000) // Convert seconds to milliseconds
  }

  const volume = () => {
    return gainNode.gain.value
  }

  const rampVolume = (duration, targetVolume) => {
    const volume = gainNode.gain.value
    const currentTime = audioContext.currentTime
    gainNode.gain.cancelScheduledValues(currentTime)
    gainNode.gain.setValueAtTime(volume, currentTime)
    gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration)
  }

  const duck = (duration, duckVolume) => {
    rampVolume(duration, duckVolume)
  }

  const unduck = (duration, unduckVolume = 1) => {
    rampVolume(duration, unduckVolume)
  }

  return {
    end,
    volume,
    duck,
    unduck,
  }
}