function calculateTotal() {

    const cost = parseFloat(document.getElementById("costInput").value);

    if (isNaN(cost) || cost <= 0) {
        document.getElementById("totalResult").innerText =
            "Please enter a valid cost.";
        return;
    }

    const markupRate = 0.20; // 20% markup
    const total = cost + (cost * markupRate);

    document.getElementById("totalResult").innerText =
        "Total with 20% markup: $" + total.toFixed(2);
}
