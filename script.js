document.getElementById('body-type').addEventListener('change', updateBodySection);
document.getElementById('http-method').addEventListener('change', updateBodySection);
document.getElementById('add-header').addEventListener('click', addHeaderField);
document.getElementById('add-body').addEventListener('click', addBodyField);
document.getElementById('send-request').addEventListener('click', sendRequest);

function updateBodySection() {
    const method = document.getElementById('http-method').value.toUpperCase();
    const bodySection = document.getElementById('body-section');
    const bodyType = document.getElementById('body-type').value;
    const jsonBody = document.getElementById('body-json');
    
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        bodySection.style.display = 'block';
        
        if (bodyType === 'json') {
            jsonBody.style.display = 'block';
        } else if (bodyType === 'form-data') {
            jsonBody.style.display = 'none';
            addBodyField(); // Ensure form-data fields are visible if selected
        } else {
            bodySection.style.display = 'none';
            jsonBody.style.display = 'none';
        }
    } else {
        bodySection.style.display = 'none';
        jsonBody.style.display = 'none'; // Hide JSON input when method is not POST/PUT/PATCH
    }
}

function addHeaderField() {
    const headersSection = document.getElementById('headers-section');
    const newHeader = createFormDataRow();
    headersSection.appendChild(newHeader);
}

function addBodyField() {
    const bodySection = document.getElementById('body-section');
    const bodyType = document.getElementById('body-type').value;
    
    if (bodyType === 'form-data') {
        const newBodyField = createFormDataRow();
        bodySection.appendChild(newBodyField);
    }
}

function createFormDataRow() {
    const row = document.createElement('div');
    row.className = 'form-data-row';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'key';
    keyInput.placeholder = 'Key';

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'value';
    valueInput.placeholder = 'Value';

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-row';
    removeButton.textContent = '-';
    removeButton.addEventListener('click', () => row.remove());

    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(removeButton);

    return row;
}

function sendRequest() {
    const url = document.getElementById('api-url').value;
    const method = document.getElementById('http-method').value.toUpperCase();
    const headers = getFormData('headers-section');
    const bodyType = document.getElementById('body-type').value;

    let options = {
        method,
        headers
    };

    // Display loading icon
    document.getElementById('loading-icon').style.display = 'block';

    if (method !== 'GET' && method !== 'DELETE') {
        if (bodyType === 'json') {
            const jsonBody = document.getElementById('body-json').value.trim();
            if (jsonBody) {
                try {
                    options.body = JSON.stringify(JSON.parse(jsonBody));
                    headers['Content-Type'] = 'application/json';
                } catch (error) {
                    alert('Invalid JSON body: ' + error.message);
                    document.getElementById('loading-icon').style.display = 'none';
                    return;
                }
            }
        } else if (bodyType === 'form-data') {
            const formData = new FormData();
            const bodyData = getFormData('body-section');
            for (const key in bodyData) {
                formData.append(key, bodyData[key]);
            }
            options.body = formData;
        }
    }

    fetch(url, options)
        .then(response => {
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else if (contentType && contentType.includes('text')) {
                return response.text();
            } else {
                return response.blob(); // Handle binary data like images
            }
        })
        .then(data => {
            if (typeof data === 'object') {
                document.getElementById('response').textContent = JSON.stringify(data, null, 2);
            } else {
                document.getElementById('response').textContent = data;
            }
            saveHistory(url, method, headers, options.body, data);
        })
        .catch(error => {
            document.getElementById('response').textContent = `Error: ${error.message}`;
        })
        .finally(() => {
            // Hide loading icon
            document.getElementById('loading-icon').style.display = 'none';
        });
}

function getFormData(sectionId) {
    const data = {};
    const section = document.getElementById(sectionId);
    const rows = section.getElementsByClassName('form-data-row');

    Array.from(rows).forEach(row => {
        const key = row.querySelector('.key').value;
        const value = row.querySelector('.value').value;
        if (key) data[key] = value;
    });

    return data;
}

function saveHistory(url, method, headers, body, response) {
    const history = JSON.parse(localStorage.getItem('apiHistory')) || [];
    history.push({ url, method, headers, body, response });
    localStorage.setItem('apiHistory', JSON.stringify(history));
    displayHistory();
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem('apiHistory')) || [];
    const historyList = document.getElementById('history');
    historyList.innerHTML = '';

    // Sort history by the order in which it was saved (latest first)
    history.sort((a, b) => {
        // Assuming the history array is in the correct order when saved
        return history.indexOf(b) - history.indexOf(a);
    });

    history.forEach((entry, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'history-item';
        listItem.innerHTML = `Request ${index + 1}: ${entry.method} ${entry.url}
            <button onclick="viewHistory(${index})">View</button>
            <button onclick="deleteHistory(${index})">Delete</button>`;
        historyList.appendChild(listItem);
    });
}


function viewHistory(index) {
    const history = JSON.parse(localStorage.getItem('apiHistory')) || [];
    const entry = history[index];

    // Open a new window and populate with entry data
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html>
        <head><title>Request Details</title></head>
        <body>
        <h1>Request Details</h1>
        <p><strong>URL:</strong> ${entry.url}</p>
        <p><strong>Method:</strong> ${entry.method}</p>
        <p><strong>Headers:</strong></p>
        <pre>${JSON.stringify(entry.headers, null, 2)}</pre>
        <p><strong>Body:</strong></p>
        <pre>${entry.body ? JSON.stringify(entry.body, null, 2) : 'No body'}</pre>
        <p><strong>Response:</strong></p>
        <pre>${JSON.stringify(entry.response, null, 2)}</pre>
        </body>
        </html>
    `);
    newWindow.document.close();
}

function deleteHistory(index) {
    const history = JSON.parse(localStorage.getItem('apiHistory')) || [];
    history.splice(index, 1);
    localStorage.setItem('apiHistory', JSON.stringify(history));
    displayHistory();
}

// Initial display of history
displayHistory();
