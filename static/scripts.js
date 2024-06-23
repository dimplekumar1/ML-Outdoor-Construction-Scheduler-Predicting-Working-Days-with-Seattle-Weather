document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const form = document.getElementById('date-form');
    const resultDiv = document.getElementById('result');
    const testResultsDiv = document.getElementById('testResultsContainer');
    const errorDiv = document.getElementById('error-message');
    const calendarContainer = document.getElementById('calendarContainer');
    const dashboardDiv = document.getElementById('dashboardContainer');

    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get start and end date values from form
        const startDateStr = document.getElementById('start_date').value;
        const endDateStr = document.getElementById('end_date').value;

        // Clear previous results and errors
        resultDiv.innerHTML = '';
        errorDiv.textContent = '';
        calendarContainer.innerHTML = '';
        testResultsDiv.innerHTML = '';
        dashboardDiv.innerHTML = '';

        // Check if any field is empty
        if (startDateStr.trim() === '' || endDateStr.trim() === '') {
            errorDiv.textContent = 'ERROR: Please fill in both start and end dates.';
            return;
        }

        // Parse dates and check if they are valid
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            errorDiv.textContent = 'ERROR: Invalid date format. Please use YYYY-MM-DD.';
            return;
        }

        // Check if start date is greater than end date
        if (startDate > endDate) {
            errorDiv.textContent = 'ERROR: Start date must be less than or equal to end date.';
            return;
        }

        // If all checks pass, proceed with fetch
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ start_date: startDateStr, end_date: endDateStr }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Display test results
            testResultsDiv.classList.add('test-results-container');
            dashboardDiv.classList.add('dashboard-container');
            resultDiv.innerHTML = `<h2>Results</h2>
                                   <p>Working Days: ${data.working_days_count}</p>
                                   <p>Non-Working Days: ${data.non_working_days_count}</p>`;

            // Display detailed evaluation
            let evaluationHTML = `<h1>Evaluation of the Model</h1>
                                  <h3>Maximum and Minimum Temperature:</h3>
                                  <p>Accuracy of Minimum Temperature Prediction: ${data.accuracy_temp_min}%</p>
                                  <p>Accuracy of Maximum Temperature Prediction: ${data.accuracy_temp_max}%</p>
                                  <p>Mean Absolute Error (MAE) Value for Min. Temperature Prediction: ${data.mae_temp_min}</p>
                                  <p>Mean Absolute Error (MAE) Value for Max. Temperature Prediction: ${data.mae_temp_max}</p>
                                  <br>
                                  <h3>Weather Type:</h3>
                                  <p>Accuracy of Weather Type Prediction: ${data.accuracy_weather}%</p>
                                  <br>
                                  <p>Classification Report for Weather Type Prediction:</p>`;

            // Parse the classification report for Weather Type Prediction
            const reportWeather = data.report_weather;
            const lines = reportWeather.split('\n');
            evaluationHTML += `<table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 1px solid #ccc;">
                                        <th style="padding: 8px; text-align: left;">Class</th>
                                        <th style="padding: 8px; text-align: left;">Precision</th>
                                        <th style="padding: 8px; text-align: left;">Recall</th>
                                        <th style="padding: 8px; text-align: left;">F1-Score</th>
                                        <th style="padding: 8px; text-align: left;">Support</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            lines.slice(0, 11).forEach((line, index) => {
                const columns = line.trim().split(/\s+/);
                if (index === lines.length - 1) {
                    evaluationHTML += `<tr>
                                        <td colspan="4" style="padding: 8px; text-align: left;">${columns[0]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[1]}</td>
                                       </tr>`;
                } else if (columns.length === 5) {
                    evaluationHTML += `<tr>
                                        <td style="padding: 8px; text-align: left;">${columns[0]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[1]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[2]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[3]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[4]}</td>
                                       </tr>`;
                } else if (columns.length === 6) {
                    evaluationHTML += `<tr>
                                        <td colspan="1" style="padding: 8px; text-align: left;">${columns[0]} ${columns[1]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[2]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[3]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[4]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[5]}</td>
                                       </tr>`;
                }
            });

            evaluationHTML += `</tbody></table>`;
            evaluationHTML += `<br>
                               <h3>Working/Non-working Day:</h3>
                               <p>Accuracy of Working/Non-working Day Prediction: ${data.accuracy_day_type}%</p>
                               <br>
                               <p>Classification Report for Working/Non-working Day Prediction:</p>`;

            // Parse the classification report for Working/Non-working Day Prediction
            const reportDayType = data.report_day_type;
            const linesDayType = reportDayType.split('\n');
            evaluationHTML += `<table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 1px solid #ccc;">
                                        <th style="padding: 8px; text-align: left;">Class</th>
                                        <th style="padding: 8px; text-align: left;">Precision</th>
                                        <th style="padding: 8px; text-align: left;">Recall</th>
                                        <th style="padding: 8px; text-align: left;">F1-Score</th>
                                        <th style="padding: 8px; text-align: left;">Support</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            linesDayType.forEach((line, index) => {
                const columns = line.trim().split(/\s+/);
                if (columns.length === 5) {
                    evaluationHTML += `<tr>
                                        <td style="padding: 8px; text-align: left;">${columns[0]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[1]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[2]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[3]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[4]}</td>
                                       </tr>`;
                } else if (columns.length === 6) {
                    evaluationHTML += `<tr>
                                        <td colspan="1" style="padding: 8px; text-align: left;">${columns[0]} ${columns[1]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[2]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[3]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[4]}</td>
                                        <td style="padding: 8px; text-align: left;">${columns[5]}</td>
                                       </tr>`;
                }
            });

            evaluationHTML += `</tbody></table>`;

            // Update test results container with evaluation HTML
            testResultsDiv.innerHTML = evaluationHTML;

            // Update dashboard with visual insights
            dashboardDiv.innerHTML = `
                <h1>Visual Insights into Seattle's Weather Trends</h1>
                <h2>Average Monthly Temperatures (2012-2015)</h2>
                <div class="chart-container">
                    <canvas id="temperatureChart"></canvas>
                </div>
                <br>
                <br>
                <br>
                <h2>Percentage of Working vs Non-Working Days (2012-2015)</h2>
                <br>
                <div class="chart-container">
                    <canvas id="dayTypeChart"></canvas>
                </div>
                <br>
                <br>
                <br>
                <h2>Weather Distribution by Day Type (Working/Non-working Day) (2012-2015)</h2>
                <div class="chart-container">
                    <canvas id="weatherDistributionChart"></canvas>
                </div>
            `;

            // Create the charts
            createCharts();

            // Generate calendar based on the fetched data
            console.log('Generating calendar');
            generateCalendar(startDateStr, endDateStr, data.events);

            // Apply styles
            calendarContainer.classList.add('calendar-container');
        })
        .catch(error => {
            console.error('Error:', error);
            errorDiv.textContent = 'ERROR: Oops! There was a problem fetching the data. Please try again.';
        });
    });
});

// Function to generate calendar based on start and end dates
function generateCalendar(startDateStr, endDateStr, events) {
    const calendarContainer = document.getElementById('calendarContainer');
    calendarContainer.innerHTML = '';

    // Create legend for colors
    const legendDiv = document.createElement('div');
    legendDiv.classList.add('legend');
    legendDiv.innerHTML = `
        <h1>Weather Forecast</h1>
        <div> </div>
        <div class="legend-container">
          <div class="legend-item">
            <div class="legend-title">Legend: </div>
            <div class="legend-color-working-day"></div>
            <div class="legend-text">Working Day</div>
            <div class="legend-color-rain-day"></div>
            <div class="legend-text">Rain Day</div>
            <div class="legend-color-snow-day"></div>
            <div class="legend-text">Snow Day</div>
            <div class="legend-color-cold-day"></div>
            <div class="legend-text">Cold Day</div>
            <div class="legend-color-today">T</div>
            <div class="legend-text">Date Today</div>
          </div>
        </div>
    `;
    calendarContainer.appendChild(legendDiv);

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Increment startDate by one day
    startDate.setDate(startDate.getDate() + 1);

    // Increment endDate by one day
    endDate.setDate(endDate.getDate() + 1);

    const months = getMonthsBetween(startDate, endDate);

    if (months.length === 1) {
        const monthDiv = createMonthDiv(months[0], events);
        calendarContainer.appendChild(monthDiv);
        monthDiv.style.margin = 'auto';
    } else {
        let rowDiv = document.createElement('div');
        rowDiv.classList.add('row');
        calendarContainer.appendChild(rowDiv);

        for (let i = 0; i < months.length; i++) {
            if (i > 0 && i % 4 === 0) {
                rowDiv = document.createElement('div');
                rowDiv.classList.add('row');
                calendarContainer.appendChild(rowDiv);
            }

            const monthDiv = createMonthDiv(months[i], events);
            rowDiv.appendChild(monthDiv);
        }
    }
}

// Function to get all months between two dates
function getMonthsBetween(startDate, endDate) {
    const months = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        months.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
    }

    return months;
}

// Function to create a div representing a month in the calendar
function createMonthDiv(date, events) {
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const monthDiv = document.createElement('div');
    monthDiv.classList.add('month');
    monthDiv.innerHTML = `<div class="month-name">${month}</div><div class="days" id="${date.getMonth()}"></div>`;

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = i;

        // Find event for current day
        const event = events.find(event => {
            const eventDate = new Date(event.start);
            // Increment eventDate by one day
            eventDate.setDate(eventDate.getDate() + 1);
            return eventDate.getFullYear() === date.getFullYear() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getDate() === i;
        });

        // Apply className based on event data
        if (event && event.className) {
            dayDiv.classList.add(event.className);
        }

        // Highlight today's date
        if (date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear() && i === new Date().getDate()) {
            dayDiv.classList.add('today');
        }

        monthDiv.querySelector('.days').appendChild(dayDiv);
    }

    return monthDiv;
}
