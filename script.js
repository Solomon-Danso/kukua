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
    
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' ||method === 'DELETE') {
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

// Modified createFormDataRow to include file input
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

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'file';
    fileInput.style.display = 'none'; // Hidden by default

    const toggleFileInputButton = document.createElement('button');
    toggleFileInputButton.textContent = 'Add File';
    toggleFileInputButton.addEventListener('click', (e) => {
        e.preventDefault();
        valueInput.style.display = valueInput.style.display === 'none' ? 'inline-block' : 'none';
        fileInput.style.display = fileInput.style.display === 'none' ? 'inline-block' : 'none';
    });

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-row';
    removeButton.textContent = '-';
    removeButton.addEventListener('click', () => row.remove());

    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(fileInput);
    row.appendChild(toggleFileInputButton);
    row.appendChild(removeButton);

    return row;
}

// Updated getFormData to include files
function getFormData(sectionId) {
    const data = new FormData();
    const section = document.getElementById(sectionId);
    const rows = section.getElementsByClassName('form-data-row');

    Array.from(rows).forEach(row => {
        const key = row.querySelector('.key').value;
        const value = row.querySelector('.value').value;
        const fileInput = row.querySelector('.file');

        if (key) {
            if (fileInput && fileInput.files.length > 0) {
                data.append(key, fileInput.files[0]); // Append file
            } else {
                data.append(key, value); // Append regular text field value
            }
        }
    });

    return data;
}

// Updated sendRequest to handle FormData correctly


function sendRequest() {
    const url = document.getElementById('api-url').value;
    const method = document.getElementById('http-method').value.toUpperCase();
    const headers = getHeaders();
    const bodyType = document.getElementById('body-type').value;

    let options = {
        method,
        headers: headers,
    };

    // Display loading icon
    document.getElementById('loading-icon').style.display = 'block';

    if (method !== 'GET') {
        if (bodyType === 'json') {
            const jsonBody = document.getElementById('body-json').value.trim();
            if (jsonBody) {
                try {
                    options.body = JSON.stringify(JSON.parse(jsonBody));
                    options.headers['Content-Type'] = 'application/json';
                } catch (error) {
                    alert('Invalid JSON body: ' + error.message);
                    document.getElementById('loading-icon').style.display = 'none';
                    return;
                }
            }
        } else if (bodyType === 'form-data') {
            options.body = getFormData('body-section');
        }
    }

    fetch(url, options)
    .then(response => {
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else if (contentType && contentType.includes('text/html')) {
            return response.text(); // Return the HTML as a string
        } else {
            throw new Error('Unsupported content type: ' + contentType);
        }
    })
    .then(data => {
        // Clear the response container
        const responseContainer = document.getElementById('response');
        responseContainer.innerHTML = ''; // Clear previous response

        if (typeof data === 'object') {
            responseContainer.textContent = JSON.stringify(data, null, 2);
            saveHistory(url, method, headers, options.body, data);
        } else {
            // If the data is not an object, render it in an iframe
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '500px'; // Adjust height as needed
            
            // Set the raw HTML response directly to the iframe
            iframe.srcdoc = data; // Use the raw HTML data directly
            
            responseContainer.appendChild(iframe); // Append iframe to the response container
        }
    })
    .catch(error => {
        // Clear the response container and display the error as plain text
        document.getElementById('response').textContent = `Error: ${error.message}`;
    })
    .finally(() => {
        document.getElementById('loading-icon').style.display = 'none';
    });



}


// Function to sanitize and remove <script> and <style> tags
function sanitizeHTML(html) {
    // Create a DOMParser to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove <script> tags
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove <style> tags
    const styles = doc.querySelectorAll('style');
    styles.forEach(style => style.remove());

    //Remove button 
    const btn = doc.querySelectorAll('button');
    btn.forEach(bt => bt.remove());

    // Return the sanitized HTML as text (without the <script> and <style> tags)
    return doc.body.innerHTML;
}



function getHeaders() {
    const headers = {};
    const headersSection = document.getElementById('headers-section');
    const rows = headersSection.getElementsByClassName('form-data-row');

    Array.from(rows).forEach(row => {
        const key = row.querySelector('.key').value;
        const value = row.querySelector('.value').value;

        if (key) {
            headers[key] = value; // Add each header to the headers object
        }
    });

    return headers;
}




function saveHistory(url, method, headers, body, response) {
    const history = JSON.parse(localStorage.getItem('apiHistory')) || [];
    
    // Determine the body type
    const bodyType = body instanceof FormData ? 'FormData' : 'JSON';
    
    // Convert FormData to a JSON object if it's the body
    const bodyData = body instanceof FormData ? formDataToObject(body) : body;

    history.push({ url, method, headers, bodyType, body: bodyData, response });
    localStorage.setItem('apiHistory', JSON.stringify(history));
    displayHistory();
}


// Function to convert FormData to a plain object
function formDataToObject(formData) {
    const obj = {};
    formData.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}


function displayHistory() {
    const history = JSON.parse(localStorage.getItem('apiHistory')) || [];
    const historyList = document.getElementById('history');
    historyList.innerHTML = '';

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


    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
         <h1>Request Details</h1>
        <p><strong>URL:</strong> ${entry.url}</p>
        <p><strong>Method:</strong> ${entry.method}</p>
        <p><strong>Headers:</strong></p>
        <pre>${JSON.stringify(entry.headers, null, 2)}</pre>
        <p><strong>Body:</strong></p>
        <pre>${entry.body ? JSON.stringify(entry.body, null, 2) : 'No body'}</pre>
        <p><strong>Response:</strong></p>
        <pre>${JSON.stringify(entry.response, null, 2)}</pre>
    `;

    modal.style.display = 'block';

}


const span = document.getElementsByClassName('close')[0];
span.onclick = function() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}


function deleteHistory(index) {
    const history = JSON.parse(localStorage.getItem('apiHistory')) || [];
    history.splice(index, 1);
    localStorage.setItem('apiHistory', JSON.stringify(history));
    displayHistory(); // Refresh the history list to reflect changes
}

// Initial display of history
displayHistory();
