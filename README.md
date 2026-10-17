# SentraScan – API Security Testing Tool

SentraScan is a Python-based web application that performs basic security checks on HTTP API endpoints and generates security findings in a dashboard and JSON reports.

This project was developed as a hands-on cybersecurity learning project to explore API security testing, HTTP methods, security headers, authentication checks, input validation, error handling, and sensitive information exposure.

## Features

- **API Scanning:** Sends HTTP requests to a specified API endpoint.
- **Security Header Analysis:** Checks for important HTTP security headers.
- **HTTP Method Testing:** Examines how an endpoint responds to HTTP methods.
- **Authentication Checks:** Identifies endpoints that appear accessible without authentication.
- **Input Validation Checks:** Tests how endpoints handle selected input values.
- **Error Message Analysis:** Checks responses for potentially revealing error details.
- **Sensitive Data Checks:** Looks for possible sensitive information exposure.
- **Security Reports:** Generates JSON reports containing scan results and findings.
- **Dashboard:** Displays findings, severity summaries, response times, and scan history.

## Technology Stack

- Python
- Flask
- Requests
- HTML
- CSS
- JavaScript
- Kali Linux

## Project Structure

```text
api-security-tool/
├── app.py
├── report_generator.py
├── scan_history.py
├── requirements.txt
├── scanners/
│   ├── api_scanner.py
│   ├── auth_scanner.py
│   ├── error_scanner.py
│   ├── exposure_scanner.py
│   ├── header_scanner.py
│   ├── input_scanner.py
│   └── method_scanners.py
├── static/
│   ├── script.js
│   └── style.css
├── templates/
│   └── index.html
├── test_api/
│   └── test_api.py
└── reports/
```

## Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd api-security-tool
   ```

2. Create and activate a virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the application:

   ```bash
   python app.py
   ```

5. Open the dashboard at:

   `http://127.0.0.1:5000`

## Usage

1. Start the SentraScan application.
2. Enter an API endpoint that you own or are explicitly authorized to test.
3. Start the scan.
4. Review the security findings and severity classifications.
5. Inspect the generated report and scan history.

The included `test_api/` directory provides a local test API for development and learning. Follow the project's actual configuration to start that API before scanning its endpoints.

## Learning Objectives

- Understand HTTP requests and responses.
- Learn common API security testing concepts.
- Practice Python-based security automation.
- Explore security findings, severity levels, and JSON reporting.
- Build a web dashboard using Flask and JavaScript.

## Limitations

SentraScan performs basic automated checks and may produce false positives or miss vulnerabilities. Its findings require manual verification. It is a learning tool, not a replacement for a professional security assessment.

## Responsible Use

Use SentraScan only against systems you own or have explicit permission to test. Do not use it to access, disrupt, or probe unauthorized systems.

## Author

**Vinothini P.**

Cybersecurity learning project – API Security Testing
