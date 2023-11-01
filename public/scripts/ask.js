function sendMessage() {
    const userMessage = document.getElementById("user-input").value;
    if (userMessage.trim() === "") {
        return;
    }

    // Show typing animation after the user clicks the send button
    const typingAnimation = document.querySelector(".typing-animation");
    typingAnimation.style.display = "block";

    // Simulate a 3-second delay before bot's response
    setTimeout(() => {
        // Remove typing animation and show bot's response
        typingAnimation.style.display = "none";
        const botResponse = "Great question Janice! In a research study, the treatment isn't risk-free, and there's no guarantee it will cure your mom's cancer. But standard treatments have their own risks and aren't guaranteed either. The benefit of a research study is that you'll receive extra attention from your medical team, who closely monitor your well-being, making your treatment more comfortable. Plus, multiple organizations ensure your safety during the study. If you want to see what studies are out there, click on the red button in the bottom right corner of this page and we can start.";
        addMessage("Vanessa", botResponse);

         // Play the audio response
         const audioResponse = document.getElementById("audio-response");
         audioResponse.play();
    }, 3000);
    
    // Add user message to the chat
    addMessage("You", userMessage);
    document.getElementById("user-input").value = "";
}

function addMessage(sender, message) {
    const chatContainer = document.getElementById("chat-container");
    const messageDiv = document.createElement("div");
    messageDiv.className = sender === "You" ? "user-message" : "bot-message";
    messageDiv.innerHTML = sender === "You"
        ? `<strong>${sender}:</strong> ${message}`
        : `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageDiv);
}