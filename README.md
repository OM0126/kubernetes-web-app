# Containerized Web App

A React web application that I built and deployed using Docker and Kubernetes.

The main goal of this project was to understand how a normal React application can be built, packaged into a Docker image, run as a container, and then deployed and managed using Kubernetes.

## Tech Stack

- React
- Vite
- Node.js
- Nginx
- Docker
- Kubernetes
- Minikube
- kubectl
- Git & GitHub

---

## Project Flow.

```text
React + Vite
     ↓
npm run build
     ↓
Dockerfile
     ↓
Docker Image
     ↓
Docker Container
     ↓
Minikube
     ↓
Kubernetes Deployment
     ↓
Kubernetes Pods
     ↓
Kubernetes Service
     ↓
Browser
Project Structure
containerized-web-app/
│
├── public/
├── src/
│   ├── assets/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .dockerignore
├── .gitignore
├── Dockerfile
├── deploy.yaml
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
1. Run the React App Locally

First, open the project in VS Code.

Go to the project directory:

cd ~/cal

Install the dependencies:

npm install

Start the Vite development server:

npm run dev

Vite will show a local URL, usually:

http://localhost:5173/

Open that URL in the browser.

At this stage, the application is running directly through the Vite development server.

2. Create the Production Build

Before creating the Docker image, create a production build:

npm run build

Vite creates a dist directory:

dist/

The dist directory contains the production version of the React application.

3. Dockerfile

The project uses a multi-stage Docker build.

The first stage uses Node.js to build the React application.

The second stage uses Nginx to serve the production files.

# Stage 1: Build React application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build Vite application
RUN npm run build


# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy React production build
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
Why use two stages?

Node.js is needed to build the React application.

After the application is built, Node.js is not required to serve the final website.

The final application contains static HTML, CSS and JavaScript files, so Nginx can serve them.

This keeps the final Docker image cleaner and smaller.

4. Create .dockerignore

Create a .dockerignore file:

nano .dockerignore

Add:

node_modules
dist
.git
.gitignore
Dockerfile
README.md
npm-debug.log

This prevents unnecessary files from being sent to Docker during the image build.

5. Build the Docker Image

From the project directory:

docker build -t cal-app:v1 .

Here:

docker build

Builds the Docker image.

-t cal-app:v1

Gives the image the name cal-app and tag v1.

.

Uses the current directory as the Docker build context.

Check the image:

docker images

You should see something similar to:

REPOSITORY   TAG
cal-app      v1
6. Run the Docker Container

Run the image:

docker run -d -p 8080:80 --name cal-app cal-app:v1

The important part is:

8080:80

This maps:

localhost:8080
        ↓
container port 80

--name cal-app gives the container a name.

Check the running container:

docker ps

Open the application:

http://localhost:8080

At this point, the React application is running inside a Docker container.

7. Stop and Remove the Docker Container

After testing the Docker version, stop the container:

docker stop cal-app

Remove the container:

docker rm cal-app

The Docker image is still available.

Check:

docker images
8. Start Minikube

For Kubernetes, this project uses Minikube with the Docker driver.

Start Minikube:

minikube start --driver=docker

Check Minikube:

minikube status

A healthy cluster should show:

host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured

Check the Kubernetes node:

kubectl get nodes

Expected result:

NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   ...   ...
9. Load the Docker Image into Minikube

Because the image was built locally, Minikube needs access to it.

Load the image:

minikube image load cal-app:v1

Check that the image is available:

minikube image ls | grep cal-app
10. Kubernetes Deployment

Create a file called:

deploy.yaml

The Deployment manages the Pods.

apiVersion: apps/v1
kind: Deployment
metadata:
  name: cal-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cal-app
  template:
    metadata:
      labels:
        app: cal-app
    spec:
      containers:
        - name: cal-app
          image: cal-app:v1
          imagePullPolicy: Never
          ports:
            - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: cal-service
spec:
  type: NodePort
  selector:
    app: cal-app
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
11. Apply the Kubernetes Configuration

Run:

kubectl apply -f deploy.yaml

Check the Deployment:

kubectl get deployments

Check the Pods:

kubectl get pods

Because the Deployment has:

replicas: 2

Kubernetes creates two Pods.

Example:

NAME                       READY   STATUS    RESTARTS   AGE
cal-app-xxxxxxxxxx        1/1     Running   0          1m
cal-app-yyyyyyyyyy        1/1     Running   0          1m
12. Understand the Kubernetes Parts
Deployment

The Deployment manages the application.

It makes sure the required number of Pods are running.

In this project:

replicas: 2

means Kubernetes tries to keep two Pods running.

Pod

A Pod is the smallest deployable unit in Kubernetes.

Our Pods contain the cal-app container.

Container

The container runs the Docker image:

cal-app:v1

The container contains the Nginx server and the built React application.

Service

The Service provides a stable way to access the Pods.

Our Service is:

cal-service

It uses:

NodePort

to expose the application.

13. Access the Application Through Kubernetes

Get the Service:

kubectl get svc

You should see:

cal-service

The easiest way to open the application with Minikube:

minikube service cal-service

Or get the URL:

minikube service cal-service --url

Open the URL in the browser.

The application is now running through Kubernetes.

14. Check Pods

List Pods:

kubectl get pods

Watch Pods live:

kubectl get pods -w

Press:

Ctrl + C

to stop watching.

15. Check Application Logs

First find the Pod:

kubectl get pods

Then:

kubectl logs <pod-name>

For example:

kubectl logs cal-app-xxxxxxxxxx

To continuously watch the logs:

kubectl logs -f <pod-name>

Press:

Ctrl + C

to stop following the logs.

16. Check Logs From All Pods

Because we have multiple Pods:

kubectl logs -l app=cal-app

Follow the logs:

kubectl logs -f -l app=cal-app
17. Describe a Pod

If a Pod has a problem:

kubectl describe pod <pod-name>

This is useful for checking:

Pod events
Container status
Image information
Restart count
Networking
Scheduling problems
Errors
18. Kubernetes Self-Healing

One important thing tested in this project was Kubernetes self-healing.

First check the Pods:

kubectl get pods

Delete one Pod:

kubectl delete pod <pod-name>

Then check again:

kubectl get pods

The Deployment automatically creates another Pod to maintain:

replicas: 2

This is one of the main benefits of using Kubernetes.

19. Scale the Application

The Deployment can also be scaled.

Increase the number of Pods from 2 to 3:

kubectl scale deployment cal-app --replicas=3

Check:

kubectl get pods

You should now have three Pods.

Scale it back:

kubectl scale deployment cal-app --replicas=2
20. Useful Docker Commands

Check running containers:

docker ps

Check all containers:

docker ps -a

List images:

docker images

Build an image:

docker build -t cal-app:v1 .

Run a container:

docker run -d -p 8080:80 --name cal-app cal-app:v1

Stop a container:

docker stop cal-app

Remove a container:

docker rm cal-app

Remove an image:

docker rmi cal-app:v1
21. Useful Kubernetes Commands

Check cluster:

kubectl get nodes

Check Pods:

kubectl get pods

Check Deployments:

kubectl get deployments

Check Services:

kubectl get svc

Check everything:

kubectl get all

Apply configuration:

kubectl apply -f deploy.yaml

Delete the deployment:

kubectl delete -f deploy.yaml

Pod logs:

kubectl logs <pod-name>

Live logs:

kubectl logs -f <pod-name>

Pod details:

kubectl describe pod <pod-name>
22. Run the Project Again
React Development
cd ~/cal
npm install
npm run dev

Open:

http://localhost:5173
Docker
cd ~/cal
docker build -t cal-app:v1 .
docker run -d -p 8080:80 --name cal-app cal-app:v1

Open:

http://localhost:8080
Kubernetes
minikube start
minikube image load cal-app:v1
kubectl apply -f deploy.yaml
kubectl get pods
kubectl get svc
minikube service cal-service --url
What I Learned

Through this project I learned how a web application moves from development to deployment.

React / Vite
How to run a React application locally
How Vite works
How to create a production build
How the dist folder is generated
Docker
What a Dockerfile does
How to create a Docker image
Difference between an image and a container
How to run a container
How port mapping works
How Nginx can serve a React production build
Why multi-stage Docker builds are useful
How .dockerignore works
Kubernetes
What Minikube is
What kubectl is
What a Deployment is
What a Pod is
What a Service is
How Deployments create Pods
How replicas work
How Kubernetes exposes an application
How Kubernetes automatically recreates deleted Pods
How to scale an application
How to check Pod logs
How to troubleshoot Pods using kubectl describe
Final Architecture
                    Developer
                        │
                        ▼
                  React + Vite
                        │
                        ▼
                  npm run build
                        │
                        ▼
                      dist/
                        │
                        ▼
                   Dockerfile
                        │
                        ▼
                  Docker Image
                   cal-app:v1
                        │
                        ▼
                 Minikube Image
                        │
                        ▼
              Kubernetes Deployment
                        │
                 ┌──────┴──────┐
                 ▼             ▼
              Pod 1          Pod 2
             cal-app        cal-app
                 │             │
                 └──────┬──────┘
                        ▼
               Kubernetes Service
                  cal-service
                        │
                        ▼
                     NodePort
                        │
                        ▼
                     Browser
Project Goal

The main purpose of this project was to understand the complete basic DevOps deployment flow:

Develop
   ↓
Build
   ↓
Containerize
   ↓
Run
   ↓
Deploy
   ↓
Monitor
   ↓
Scale

This project helped me understand how a normal web application can be packaged with Docker and then managed using Kubernetes.
