Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Audio 1
$synth.SetOutputToWaveFile("F:\TKHSAS\public\audio1.wav")
$synth.Speak("This is the first listening passage. Welcome to the university library. We have a strict quiet policy. Please make sure your phones are on silent. Now, let's talk about how to check out a book.")
$synth.Dispose()

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
# Audio 2
$synth.SetOutputToWaveFile("F:\TKHSAS\public\audio2.wav")
$synth.Speak("This is the second listening passage. Good morning passengers. This is your captain speaking. We will be experiencing some slight turbulence as we pass over the mountains. Please keep your seatbelts fastened.")
$synth.Dispose()

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
# Audio 3
$synth.SetOutputToWaveFile("F:\TKHSAS\public\audio3.wav")
$synth.Speak("This is the third listening passage. In today's biology lecture, we will discuss the process of photosynthesis. Plants take in carbon dioxide and sunlight to produce oxygen and glucose.")
$synth.Dispose()

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
# Audio 4
$synth.SetOutputToWaveFile("F:\TKHSAS\public\audio4.wav")
$synth.Speak("This is the fourth listening passage. Thank you for calling customer service. Our menu options have recently changed. If you are calling about an existing order, press one. If you wish to speak to an agent, stay on the line.")
$synth.Dispose()

Write-Output "Generated 4 audio files in F:\TKHSAS\public"
