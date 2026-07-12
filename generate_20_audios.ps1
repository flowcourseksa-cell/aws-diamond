$audios = @(
    "Woman: Excuse me, what time does the next train to London leave? Man: The schedule says 11:00 AM, but it's delayed by 30 minutes, so it will depart at 11:30 AM.",
    "Now for your local weather. Today will be mostly sunny and warm. However, a major storm front is moving in. By tomorrow morning, expect cloudy skies, and by tomorrow afternoon, prepare for heavy rain.",
    "Man: Can I help you? You look lost. Woman: Yes, please. I have a terrible headache and I need to buy some medicine. Do you know if there is a pharmacy nearby?",
    "Man: Hello, I'd like to make a reservation for dinner tonight. Woman: Certainly, sir. For how many people? Man: It's just for me and my wife, so a table for two, please.",
    "Attention all passengers. Flight 402 to Paris is now boarding at gate 15. Please have your boarding passes ready.",
    "Teacher: Just a reminder, everyone. The history assignment must be submitted through the online portal. The portal closes on Friday at exactly 5 PM. No late submissions will be accepted.",
    "Woman: Would you like a cup of coffee to start your day? Man: Thanks, but I stopped drinking coffee last month. I usually have a cup of green tea every morning now.",
    "Thank you for calling the National Museum. We are open from Tuesday through Sunday, 9 AM to 6 PM. Please note that the museum is closed on all Mondays for maintenance.",
    "Officer: Can you describe the missing item? Man: Yes, it's made of brown leather. It has all my credit cards, my driver's license, and about fifty dollars in cash inside.",
    "Doctor: Your blood pressure is a bit high. I highly recommend that you engage in moderate physical activity, like brisk walking, for at least 30 minutes every single day.",
    "Attention staff. The IT department will be performing a major software update. To minimize disruption during work hours, the update will occur overnight. Please leave your computers on before you leave today.",
    "Man: My favorite season is definitely summer because I love going to the beach. What about you? Woman: I prefer autumn. I just love it when the leaves turn beautiful colors like red and gold.",
    "Salesperson: We have this shirt in red, green, and black right now. Customer: Do you have it in blue? Salesperson: I'm sorry, the blue one is completely out of stock until next week.",
    "If you have forgotten your password, enter your email address and click submit. We will send you an email. You must click the link in your email to securely reset your account password.",
    "Woman: You play the piano beautifully! How long have you been taking lessons? Man: Thank you. Actually, I haven't taken lessons in a while, but I've been playing since I was seven years old.",
    "Man: Should we meet at 6:30 for dinner? Woman: I have a meeting that ends late, so 6:30 is a bit too early for me. How about 7:00 PM? Man: Sounds perfect, see you at 7:00 PM.",
    "Attention park visitors. Please keep off the grass in the central square area today. Our landscaping team is planting new seeds, and walking on the soil will damage them.",
    "Customer: Hello, I just received my pizza delivery, but there's a problem. I ordered a large vegetarian pizza, but you delivered a pepperoni pizza instead.",
    "CEO: I am thrilled to announce our global expansion. We already have successful offices in London and New York, and next month, we will officially open our brand new branch in Tokyo.",
    "Manager: Whoever is the last person to leave the office tonight, please make absolutely sure to turn off all the lights to save electricity."
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

for ($i = 0; $i -lt $audios.Length; $i++) {
    $num = $i + 1
    $text = $audios[$i]
    $file = "f:\TKHSAS\public\audio$num.wav"
    
    $synth.SetOutputToWaveFile($file)
    $synth.Speak($text)
    $synth.SetOutputToDefaultAudioDevice()
    Write-Host "Generated audio$num.wav"
}
