export function createAudioSource(path, fadeInDuration) {
  let audioContext = new AudioContext()
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
      gainNode.gain.linearRampToValueAtTime(1, currentTime + fadeInDuration)
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
      audioContext.close() // Close the audio context if no longer needed
    }, (currentTime + duration) * 1000) // Convert seconds to milliseconds
  }

  const duck = (duration, duckVolume) => {
    const currentTime = audioContext.currentTime
    gainNode.gain.cancelScheduledValues(currentTime)
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
    gainNode.gain.linearRampToValueAtTime(duckVolume, currentTime + duration)
  }

  const unduck = (duration) => {
    const currentTime = audioContext.currentTime
    gainNode.gain.cancelScheduledValues(currentTime)
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
    gainNode.gain.linearRampToValueAtTime(1, currentTime + duration)
  }

  return {
    end,
    duck,
    unduck,
  }
}