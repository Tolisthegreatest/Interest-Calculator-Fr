document.addEventListener("DOMContentLoaded", () => {
    let investmentChartInstance = null;
    let realValueChartInstance = null;
    let calculationResult = null;

    document.getElementById("calculateButton").addEventListener("click", async () => {
        const startingCapital = document.getElementById("startingCapital").value;
        const monthlyInvestment = document.getElementById("monthlyInvestment").value;
        const annualInterestRate = document.getElementById("annualInterestRate").value;
        const yearsOfInvestment = document.getElementById("yearsOfInvestment").value;
        const inflationRate = document.getElementById("inflationRate").value;

        try {
            const response = await fetch("https://interest-calculator-w6du.onrender.com/calculate-investment/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    starting_capital: parseFloat(startingCapital),
                    monthly_investment: parseFloat(monthlyInvestment),
                    annual_rate: parseFloat(annualInterestRate),
                    years: parseInt(yearsOfInvestment),
                    inflation_rate: parseFloat(inflationRate)
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const result = await response.json();
            calculationResult = result; // Save the result for later use in export

            // Format and display the results (excluding "Investment Over Time" and "Real Value Over Time")
            document.getElementById("results").innerHTML = `
                <p>Total Investment: €${result.total_investment.toFixed(2)}</p>
                <p>Total Invested: €${result.total_invested.toFixed(2)}</p>
                <p>Interest Earned: €${result.interest_earned.toFixed(2)}</p>
                <p>Real Interest Earned: €${result.real_interest_earned.toFixed(2)}</p>
                <p>Real Value (Adjusted for Inflation): €${result.real_value.toFixed(2)}</p>
            `;

            // Destroy existing charts if they exist
            if (investmentChartInstance) {
                investmentChartInstance.destroy();
            }

            if (realValueChartInstance) {
                realValueChartInstance.destroy();
            }

            // Create Investment Over Time Graph
            const investmentCtx = document.getElementById('investmentChart').getContext('2d');
            investmentChartInstance = new Chart(investmentCtx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: result.investment_over_time.length }, (_, i) => i + 1),
                    datasets: [{
                        label: 'Investment Over Time (€)',
                        data: result.investment_over_time,
                        borderColor: 'blue',
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Amount (€)'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

            // Create Real Value Over Time Graph
            const realValueCtx = document.getElementById('realValueChart').getContext('2d');
            realValueChartInstance = new Chart(realValueCtx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: result.real_value_over_time.length }, (_, i) => i + 1),
                    datasets: [{
                        label: 'Real Value Over Time (€)',
                        data: result.real_value_over_time,
                        borderColor: 'red',
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Amount (€)'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

        } catch (error) {
            alert(`Something went wrong with the calculation. ${error.message}`);
        }
    });

    // Handle PDF Export (Including Charts)
    document.getElementById("exportPdfButton").addEventListener("click", () => {
        if (!calculationResult) {
            alert("No calculation result to export.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("Smart Interest Calculator - Results", 10, 10);
        doc.text(`Total Investment: €${calculationResult.total_investment.toFixed(2)}`, 10, 20);
        doc.text(`Total Invested: €${calculationResult.total_invested.toFixed(2)}`, 10, 30);
        doc.text(`Interest Earned: €${calculationResult.interest_earned.toFixed(2)}`, 10, 40);
        doc.text(`Real Interest Earned: €${calculationResult.real_interest_earned.toFixed(2)}`, 10, 50);
        doc.text(`Real Value (Adjusted for Inflation): €${calculationResult.real_value.toFixed(2)}`, 10, 60);

        // Add the Investment Over Time Chart as an image
        const investmentCanvas = document.getElementById('investmentChart');
        const investmentImage = investmentCanvas.toDataURL("image/png");
        doc.addImage(investmentImage, 'PNG', 10, 70, 180, 90);

        // Add the Real Value Over Time Chart as an image
        const realValueCanvas = document.getElementById('realValueChart');
        const realValueImage = realValueCanvas.toDataURL("image/png");
        doc.addImage(realValueImage, 'PNG', 10, 170, 180, 90);

        doc.save("investment-results.pdf");
    });

    // Handle Excel Export (Including Charts)
    document.getElementById("exportExcelButton").addEventListener("click", () => {
        if (!calculationResult) {
            alert("No calculation result to export.");
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws_data = [
            ["Total Investment", `€${calculationResult.total_investment.toFixed(2)}`],
            ["Total Invested", `€${calculationResult.total_invested.toFixed(2)}`],
            ["Interest Earned", `€${calculationResult.interest_earned.toFixed(2)}`],
            ["Real Interest Earned", `€${calculationResult.real_interest_earned.toFixed(2)}`],
            ["Real Value (Adjusted for Inflation)", `€${calculationResult.real_value.toFixed(2)}`]
        ];

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, "Investment Results");

        // Add charts as images (base64 encoded)
        const investmentCanvas = document.getElementById('investmentChart');
        const investmentImage = investmentCanvas.toDataURL("image/png");

        const realValueCanvas = document.getElementById('realValueChart');
        const realValueImage = realValueCanvas.toDataURL("image/png");

        // You can insert the images in the Excel sheet as comments or images
        // Since we can't directly insert images into Excel cells, we add them in a separate sheet or save them in a different way

        // Append the images (For simplicity, this example just appends the base64 image URL)
        const imageWs = XLSX.utils.aoa_to_sheet([
            ["Investment Over Time Chart", investmentImage],
            ["Real Value Over Time Chart", realValueImage]
        ]);
        XLSX.utils.book_append_sheet(wb, imageWs, "Charts");

        XLSX.writeFile(wb, "investment-results.xlsx");
    });
});
