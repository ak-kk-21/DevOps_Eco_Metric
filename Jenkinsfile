pipeline {
    agent any

    environment {
        PYTHON = 'C:\\Users\\DELL\\AppData\\Local\\Programs\\Python\\Python313\\python.exe'
        VENV   = 'venv'
    }

    stages {

        stage('Setup Virtual Environment') {
            steps {
                bat '''
                "%PYTHON%" -m venv %VENV% && ^
                %VENV%\\Scripts\\python.exe -m pip install --upgrade pip && ^
                %VENV%\\Scripts\\python.exe -m pip install -r requirements.txt
                '''
            }
        }

        stage('Run Tests') {
            steps {
                bat '''
                %VENV%\\Scripts\\python.exe -m pytest tests/ ^
                --cov=app ^
                --cov-report=xml ^
                --cov-report=term ^
                --junitxml=test-results/results.xml ^
                -v
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'test-results/results.xml'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t eco-metric-api:latest .'
            }
        }

        stage('Run Container (Staging)') {
            steps {
                bat '''
                docker stop eco-metric-staging 2>nul || echo "No container to stop"
                docker rm eco-metric-staging 2>nul || echo "No container to remove"
                docker run -d -p 8001:8000 --name eco-metric-staging eco-metric-api:latest
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! App running on http://localhost:8001'
        }
        failure {
            echo 'Pipeline failed — check logs above.'
        }
    }
}