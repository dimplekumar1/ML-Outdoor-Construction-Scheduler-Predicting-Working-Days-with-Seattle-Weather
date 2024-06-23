// Function to create charts using data fetched from a CSV file
function createCharts() {
    // Fetch data from CSV file and start processing
    fetch('static/seattle-weather.csv')
        .then(response => response.text())
        .then(data => {
            const parsedData = parseCSV(data);

            // Create the first chart: Monthly average temperatures
            const monthlyAverages = calculateMonthlyAverages(parsedData);
            createChart(monthlyAverages);

            // Create the second chart: Weather distribution on working and non-working days
            const weatherDistribution = calculateWeatherDistribution(parsedData);
            createWeatherDistributionChart(weatherDistribution);

            // Create the third chart: Percentage of working vs non-working days
            const percentages = calculateDayTypePercentages(parsedData);
            createDayTypeChart(percentages);
        });
}

// Function to parse CSV data into an array of objects
function parseCSV(data) {
    const lines = data.split('\n').slice(1); // Split lines, excluding header
    return lines.map(line => {
        const [date, tempMax, tempMin, weather, dayType] = line.split(',');
        return { date, tempMax: parseFloat(tempMax), tempMin: parseFloat(tempMin), weather, dayType };
    });
}

// Function to calculate monthly average temperatures
function calculateMonthlyAverages(data) {
    const months = Array.from({ length: 12 }, () => ({ minTemp: 0, maxTemp: 0, count: 0 }));
    data.forEach(({ date, tempMin, tempMax }) => {
        const month = new Date(date).getMonth(); // Get month index (0-11) from date
        months[month].minTemp += tempMin; // Accumulate minimum temperatures
        months[month].maxTemp += tempMax; // Accumulate maximum temperatures
        months[month].count++; // Count number of days in each month
    });
    return months.map(month => ({
        avgMinTemp: month.minTemp / month.count, // Calculate average minimum temperature
        avgMaxTemp: month.maxTemp / month.count, // Calculate average maximum temperature
    }));
}

// Function to calculate distribution of weather types on working vs non-working days
function calculateWeatherDistribution(data) {
    let workingDays = { drizzle: 0, rain: 0, snow: 0, sun: 0 };
    let nonWorkingDays = { drizzle: 0, rain: 0, snow: 0, sun: 0 };
    let totalWorkingDays = 0;
    let totalNonWorkingDays = 0;

    data.forEach(item => {
        if (item.dayType.trim().toLowerCase() === 'working day') {
            totalWorkingDays++;
            workingDays[item.weather]++;
        } else if (item.dayType.trim().toLowerCase() === 'non-working day') {
            totalNonWorkingDays++;
            nonWorkingDays[item.weather]++;
        }
    });

    const workingDayDistribution = {
        drizzle: (workingDays.drizzle / totalWorkingDays) * 100,
        rain: (workingDays.rain / totalWorkingDays) * 100,
        snow: (workingDays.snow / totalWorkingDays) * 100,
        sun: (workingDays.sun / totalWorkingDays) * 100
    };

    const nonWorkingDayDistribution = {
        drizzle: (nonWorkingDays.drizzle / totalNonWorkingDays) * 100,
        rain: (nonWorkingDays.rain / totalNonWorkingDays) * 100,
        snow: (nonWorkingDays.snow / totalNonWorkingDays) * 100,
        sun: (nonWorkingDays.sun / totalNonWorkingDays) * 100
    };

    return { workingDayDistribution, nonWorkingDayDistribution };
}

// Function to calculate percentage of working vs non-working days
function calculateDayTypePercentages(data) {
    let totalDays = data.length;
    let workingDays = data.filter(item => item.dayType.trim().toLowerCase() === 'working day').length;
    let nonWorkingDays = totalDays - workingDays;
    let workingPercentage = (workingDays / totalDays) * 100;
    let nonWorkingPercentage = (nonWorkingDays / totalDays) * 100;
    return { workingPercentage, nonWorkingPercentage };
}

// Function to create a line chart for monthly average temperatures
function createChart(monthlyAverages) {
    const ctx = document.getElementById('temperatureChart').getContext('2d'); // Get canvas context
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // Month labels
    const avgMinTemps = monthlyAverages.map(month => month.avgMinTemp); // Array of average minimum temperatures
    const avgMaxTemps = monthlyAverages.map(month => month.avgMaxTemp); // Array of average maximum temperatures

        new Chart(ctx, { // Create new Chart.js instance
        type: 'line', // Line chart
        data: { // Chart data
            labels, // X-axis labels (months)
            datasets: [ // Chart datasets
                {
                    label: 'Average Min Temperature', // Dataset label
                    data: avgMinTemps, // Dataset data (average minimum temperatures)
                    borderColor: '#4CAF50', // Line color
                    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Fill color
                    borderWidth: 2, // Line width
                    pointRadius: 4, // Point radius
                    pointBackgroundColor: '#4CAF50', // Point fill color
                    pointBorderColor: '#fff', // Point border color
                    pointHoverRadius: 6, // Point hover radius
                    pointHoverBackgroundColor: '#4CAF50', // Point hover fill color
                    pointHoverBorderColor: '#fff', // Point hover border color
                    fill: true, // Fill area under the line
                },
                {
                    label: 'Average Max Temperature', // Dataset label
                    data: avgMaxTemps, // Dataset data (average maximum temperatures)
                    borderColor: '#2196F3', // Line color
                    backgroundColor: 'rgba(33, 150, 243, 0.2)', // Fill color
                    borderWidth: 2, // Line width
                    pointRadius: 4, // Point radius
                    pointBackgroundColor: '#2196F3', // Point fill color
                    pointBorderColor: '#fff', // Point border color
                    pointHoverRadius: 6, // Point hover radius
                    pointHoverBackgroundColor: '#2196F3', // Point hover fill color
                    pointHoverBorderColor: '#fff', // Point hover border color
                    fill: true, // Fill area under the line
                },
            ],
        },
        options: { // Chart options
            responsive: true, // Enable responsiveness
            maintainAspectRatio: false, // Do not maintain aspect ratio
            plugins: { // Chart plugins
                legend: { // Legend settings
                    labels: { // Legend label settings
                        font: { // Legend label font settings
                            size: 14, // Font size
                            weight: 'bold' // Font weight
                        }
                    }
                }
            },
            scales: { // Chart scales (axes) settings
                y: { // Y-axis settings
                    grid: { // Y-axis grid settings
                        color: 'rgba(0, 0, 0, 0.1)', // Grid line color
                    },
                    ticks: { // Y-axis tick settings
                        beginAtZero: false, // Do not start at zero
                        font: { // Y-axis tick font settings
                            size: 14, // Font size
                            weight: 'bold' // Font weight
                        }
                    },
                    title: { // Y-axis title settings
                        display: true, // Display Y-axis title
                        text: 'Temperature (°C)', // Y-axis title text
                        font: { // Y-axis title font settings
                            size: 16, // Font size
                            weight: 'bold' // Font weight
                        }
                    }
                },
                x: { // X-axis settings
                    grid: { // X-axis grid settings
                        color: 'rgba(0, 0, 0, 0.1)', // Grid line color
                        borderWidth: 1, // Grid line width
                    },
                    ticks: { // X-axis tick settings
                        font: { // X-axis tick font settings
                            size: 14, // Font size
                            weight: 'bold' // Font weight
                        }
                    },
                    title: { // X-axis title settings
                        display: true, // Display X-axis title
                        text: 'Month', // X-axis title text
                        font: { // X-axis title font settings
                            size: 16, // Font size
                            weight: 'bold' // Font weight
                        }
                    }
                },
            },
        },
    });
}

// Function to create a bar chart for weather distribution
function createWeatherDistributionChart(weatherDistribution) {
    const ctx = document.getElementById('weatherDistributionChart').getContext('2d'); // Get canvas context
    const colors = ['#36A2EB', '#FFCE56']; // Chart colors

    const data = {
        labels: ['Drizzle', 'Rain', 'Snow', 'Sun'], // Labels for weather types
        datasets: [{
            label: 'Working Day', // Dataset label for working days
            backgroundColor: colors[0], // Background color
            barPercentage: 0.4, // Bar width as a percentage of the category width
            barThickness: 'flex', // Bar thickness
            data: [
                weatherDistribution.workingDayDistribution.drizzle.toFixed(1), // Data for drizzle
                weatherDistribution.workingDayDistribution.rain.toFixed(1), // Data for rain
                weatherDistribution.workingDayDistribution.snow.toFixed(1), // Data for snow
                weatherDistribution.workingDayDistribution.sun.toFixed(1), // Data for sun
            ]
        }, {
            label: 'Non-Working Day', // Dataset label for non-working days
            backgroundColor: colors[1], // Background color
            barPercentage: 0.4, // Bar width as a percentage of the category width
            barThickness: 'flex', // Bar thickness
            data: [
                weatherDistribution.nonWorkingDayDistribution.drizzle.toFixed(1), // Data for drizzle
                weatherDistribution.nonWorkingDayDistribution.rain.toFixed(1), // Data for rain
                weatherDistribution.nonWorkingDayDistribution.snow.toFixed(1), // Data for snow
                weatherDistribution.nonWorkingDayDistribution.sun.toFixed(1), // Data for sun
            ]
        }]
    };

    const options = { // Chart options
        responsive: true, // Enable responsiveness
        maintainAspectRatio: false, // Do not maintain aspect ratio
        plugins: { // Chart plugins
            legend: { // Legend settings
                position: 'top', // Legend position
                labels: { // Legend label settings
                    font: { // Legend label font settings
                        size: 14, // Font size
                        weight: 'bold' // Font weight
                    }
                }
            }
        },
        scales: { // Chart scales (axes) settings
            x: { stacked: false }, // X-axis stacked setting
            y: { // Y-axis settings
                stacked: false, // Y-axis stacked setting
                beginAtZero: true, // Begin Y-axis at zero
                ticks: { // Y-axis tick settings
                    callback: function(value) {
                        return value + '%'; // Y-axis tick label format
                    }
                }
            }
        }
    };

    new Chart(ctx, { // Create new Chart.js instance
        type: 'bar', // Bar chart type
        data: data, // Chart data
        options: options // Chart options
    });
}

// Function to create a pie chart for day type percentages
function createDayTypeChart(percentages) {
    const ctx = document.getElementById('dayTypeChart').getContext('2d'); // Get canvas context
    const data = {
        labels: ['Working Days', 'Non-Working Days'], // Labels for chart sections
        datasets: [{
            data: [percentages.workingPercentage, percentages.nonWorkingPercentage], // Data for chart sections
            backgroundColor: ['#36A2EB', '#FF6384'], // Background colors for chart sections
        }],
    };

    const options = { // Chart options
        responsive: true, // Enable responsiveness
        maintainAspectRatio: false, // Do not maintain aspect ratio
        plugins: { // Chart plugins
            tooltip: { // Tooltip settings
                callbacks: { // Tooltip callbacks
                    label: function(tooltipItem) {
                        return `${tooltipItem.label}: ${tooltipItem.raw.toFixed(1)}%`; // Tooltip label format
                    }
                }
            },
            legend: { // Legend settings
                display: true, // Display legend
                position: 'bottom', // Legend position
                labels: { // Legend label settings
                    generateLabels: function(chart) {
                        const data = chart.data; // Chart data
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map(function(label, i) {
                                const percentage = data.datasets[0].data[i].toFixed(1); // Percentage value
                                return {
                                    text: `${label} - ${percentage}%`, // Legend label text
                                    fillStyle: data.datasets[0].backgroundColor[i], // Legend label background color
                                    hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden, // Legend label hidden status
                                };
                            });
                        }
                        return [];
                    }
                }
            }
        }
    };

    new Chart(ctx, { // Create new Chart.js instance
        type: 'pie', // Pie chart type
        data: data, // Chart data
        options: options, // Chart options
    });
}

createCharts(); // Start creating all charts when the script is loaded
