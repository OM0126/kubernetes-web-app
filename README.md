\Containerized Web App

A React web application deployed using Docker and Kubernetes. This README documents the steps followed to run the application locally, build and run it with Docker, and deploy it with Kubernetes using Minikube.

containerized-web-app/│├── public/├── src/│   ├── assets/│   ├── App.css│   ├── App.jsx│   ├── index.css│   └── main.jsx│├── .dockerignore├── .gitignore├── Dockerfile├── deploy.yaml├── index.html├── package.json├── package-lock.json├── vite.config.js└── README.md

1. Run the React App Locally

First, clone the project or open the project folder in VS Code.

cd ~/cal

Install the dependencies:

npm install

Start the Vite development server:

npm run dev

Vite will show a local URL, usually:

http://localhost:5173/

Open that URL in your browser.

The application can now be developed normally in VS Code.

2. Create the Production Build

Before putting the application into Docker, create the production build.

npm run build

Vite creates a dist directory.

dist/

This directory contains the files that need to be served in production.

3. Dockerfile

I used a multi-stage Docker build.

The first stage uses Node.js to build the React application.

The second stage uses Nginx to serve the final production files.

Stage 1: Build React application

FROM node:22-alpine AS build

WORKDIR /app

Copy package files

COPY package*.json ./

Install dependencies

RUN npm ci

Copy application source

COPY . .

Build Vite application

RUN npm run build

Stage 2: Serve with Nginx

FROM nginx

Remove default Nginx website

RUN rm -rf /usr/share/nginx/html/*

Copy React production build

COPY --from=build /app/dist /usr/share/nginx/html

Expose HTTP

EXPOSE 80

Start Nginx

CMD ["nginx", "-g", "daemon off;"]Why use two stages?

The React application needs Node.js while it is being built.

After the build is complete, Node.js is no longer needed.

The final application is just static HTML, CSS and JavaScript, so Nginx is enough to serve it.

This also keeps the final Docker image smaller and cleaner.

4. Create .dockerignore

I created a .dockerignore file so unnecessary files are not sent to Docker during the build.

node_modulesdist.git.gitignoreDockerfileREADME.mdnpm-debug.log

5. Build the Docker Image

From the project directory:

docker build -t cal-app .

Here:

docker build builds the image-t gives the image a name and tagcal-app is the image namev1 is the version. means use the current directory as the build context

Check the image:

docker images

You should see something similar to:

REPOSITORY   TAGcal-app      v1

6. Run the Docker Container

Now run the image as a container:

docker run -d -p 8080:80 --name cal-app cal-app

Explanation:

-d

Runs the container in the background.

-p 8080:80

Maps:

localhost:8080↓container port 80--name cal-app

Gives the container a name.

Check the running container:

docker ps

Open the application:

http://localhost:8080

At this point the React application is running inside Docker.

7. Stop and Remove the Docker Container

After testing the Docker version, I stopped the standalone container because I wanted Kubernetes to manage the application.

docker stop cal-app

Remove it:

docker rm cal-app

The Docker image is still available.

Check:

docker images

8. Start Minikube

For Kubernetes, I used Minikube with the Docker driver.

Start Minikube:

minikube start --driver=docker

Check Minikube:

minikube status

A healthy cluster should show:

host: Runningkubelet: Runningapiserver: Runningkubeconfig: Configured

Check the Kubernetes node:

kubectl get nodes

Expected result:

NAME       STATUS   ROLES           AGE   VERSIONminikube   Ready    control-plane   ...   ...

9. Load the Docker Image into Minikube

Because the image was built locally, Minikube needs access to it.

I loaded the image into Minikube:

minikube image load cal-app

Check that the image is available:

minikube image ls | grep cal-app

10. Kubernetes Deployment

I created a file called:

deploy.yaml

The Deployment manages the Pods.

apiVersion: apps/v1kind: Deploymentmetadata:name: cal-appspec:replicas: 2selector:matchLabels:app: cal-apptemplate:metadata:labels:app: cal-appspec:containers:- name: cal-appimage: cal-appimagePullPolicy: Neverports:- containerPort: 80

apiVersion: v1kind: Servicemetadata:name: cal-servicespec:type: NodePortselector:app: cal-appports:- port: 80targetPort: 80nodePort: 30080

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

NAME                       READY   STATUS    RESTARTS   AGEcal-app-xxxxxxxxxx        1/1     Running   0          1mcal-app-yyyyyyyyyy        1/1     Running   0          1m

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

cal-app

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

The easiest way to open the application with Minikube is:

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

16. Check Logs From All Calculator Pods

Because we have multiple Pods:

kubectl logs -l app=cal-app

Follow the logs:

kubectl logs -f -l app=cal-app

17. Describe a Pod

If a Pod has a problem:

kubectl describe pod <pod-name>

This is useful for checking:

Pod eventsContainer statusImage informationRestart countNetworkingScheduling problemsErrors

18. Kubernetes Self-Healing

One important thing I tested was Kubernetes self-healing.

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

For example, increase the number of Pods from 2 to 3:

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

docker build -t cal-app .

Run a container:

docker run -d -p 8080:80 --name cal-app cal-app

Stop a container:

docker stop cal-app

Remove a container:

docker rm cal-app

Remove an image:

docker rmi cal-app

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

22. Running the Project Again

If the project already exists locally:

cd ~/cal

For normal React development:

npm installnpm run dev

For Docker:

docker build -t cal-app .docker run -d -p 8080:80 --name cal-app cal-app

For Kubernetes:

minikube startminikube image load cal-appkubectl apply -f deploy.yamlkubectl get podskubectl get svcminikube service cal-service --url

What I Learned

Through this project I learned how a web application moves from development to deployment.

React / Vite

How to run a React application locallyHow Vite worksHow to create a production buildHow the dist folder is generated

Docker

What a Dockerfile doesHow to create a Docker imageDifference between an image and a containerHow to run a containerHow port mapping worksHow Nginx can serve a React production buildWhy multi-stage Docker builds are usefulHow .dockerignore works

Kubernetes

What Minikube isWhat kubectl isWhat a Deployment isWhat a Pod isWhat a Service isHow Deployments create PodsHow replicas workHow Kubernetes exposes an applicationHow Kubernetes automatically recreates deleted PodsHow to scale an applicationHow to check Pod logsHow to troubleshoot Pods using kubectl describe

Final Architecture

                Developer
                   │
                   ▼
             React + Vite
                   │
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
          ┌────────┴────────┐
          ▼                 ▼
      Pod 1              Pod 2
    cal-app             cal-app
          │                 │
          └────────┬────────┘
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

Develop↓Build↓Containerize↓Run↓Deploy↓Monitor↓Scale

This project helped me understand how a normal web application can be packaged with Docker and then managed using Kubernetes.
