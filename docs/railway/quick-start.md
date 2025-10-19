# Quick Start Tutorial

Railway is a deployment platform that lets you provision infrastructure, develop locally with that infrastructure, and deploy to the cloud or simply run ready-made software from our template marketplace.

**In this guide we will cover two different topics to get you quickly started with the platform -**

1. **Deploying your project** - Bring your code and let Railway handle the rest.  
**Option 1** - Deploying from **GitHub**.  
**Option 2** - Deploying with the **CLI**.  
**Option 3** - Deploying from a **Docker Image**.
2. **Deploying a template** - Ideal for deploying pre-configured software with minimal effort.

To demonstrate deploying directly from a GitHub repository through Railway's dashboard, we'll be using a basic NextJS app that was prepared for this guide.

For the template deployment, we'll use the Umami template from our template marketplace.

## Deploying Your Project - From GitHub

If this is your first time deploying code on Railway, we recommend forking the previously mentioned NextJS app's repository so that you can follow along.

To get started deploying our NextJS app, we will first make a new project.

* Open up the dashboard → Click **New Project**.
* Choose the **GitHub repo** option.

_Railway requires a valid GitHub account to be linked. If your Railway account isn't associated with one, you will be prompted to link it._

* Search for your GitHub project and click on it.
* Choose either **Deploy Now** or **Add variables**.  
**Deploy Now** will immediately start to build and deploy your selected repo.  
**Add Variables** will bring you to the project canvas where you can add environment variables before deploying.

* If you chose **Deploy Now**, Railway will immediately start to build and deploy your project. If you chose **Add Variables**, you can add environment variables and then click **Deploy** to start the build and deployment process.

And that's it! 🎉 Your project is now ready for use.

## Deploying Your Project - From CLI

If you prefer to deploy from your local machine, you can use the Railway CLI.

* First, make sure you have the Railway CLI installed. You can install it by running `npm install -g @railway/cli` in your terminal.

* Next, you'll need to authenticate with Railway. You can do this by running `railway login` in your terminal.

* Once you're authenticated, you can deploy your project by running `railway up` in your project directory.

* Railway will automatically detect your project type and deploy it.

And that's it! 🎉 Your project is now ready for use.

## Deploying Your Project - From Docker Image

If you have a Docker image that you want to deploy, you can do so directly from the Railway dashboard.

* Open up the dashboard → Click **New Project**.
* Choose the **Empty project** option.

After the project is created, you will land on the Project Canvas. A panel will appear prompting you to Add a Service.

* Click **Add a Service** and select the **Docker Image** option from the modal that pops up.
* In the **Image name** field, enter the name of the Docker image, e.g, `blueriver/nextjs` and press Enter.

If you're using a registry other than Docker Hub (such as GitHub, GitLab, Quay), you need to provide the full Docker image URL from the respective registry.

* Press Enter and click **Deploy**.

Railway will now provision a new service for your project based on the specified Docker image.

And that's it! 🎉 Your project is now ready for use.

## The Canvas

Whether you deploy your project through the dashboard with GitHub or locally using the CLI, you'll ultimately arrive at your project canvas.

This is your _mission control_. Your project's infrastructure, environments, and deployments are all controlled from here.

Once the initial deployment is complete, your app is ready to go. If applicable, generate a domain by clicking Generate Domain within the service settings panel.

**Additional Information -**

If anything fails during this time, you can explore your build or deploy logs for clues. A helpful tip is to scroll through the entire log; important details are often missed, and the actual error is rarely at the bottom!

If you're stuck don't hesitate to open a Help Thread.

## Deploying a Template

Railway's template marketplace offers over 650+ unique templates that have been created both by the community and Railway!

Deploying a template is not too dissimilar to deploying a GitHub repo -

* Open up the dashboard → Click **New Project**.
* Choose **Deploy a template**.
* Search for your desired template.  
_Hint: If your desired template isn't found feel free to reach out to the community._
* Click on the template you want to deploy.

_Hint: Generally it's best to choose the template with a combined higher deployment and success count._

* Fill out any needed information that the template may require.  
In the case of our Umami template, we don't need to provide any extra information.
* Click **Deploy**.

Railway will now provision a new project with all services and configurations that were defined in the template.

That's it, deploying a template is as easy as a few clicks!

## Closing

Railway aims to be the simplest way to develop, deploy, and diagnose issues with your application.

As your Project scales, Railway scales with you by supporting multiple Teams, vertical scaling, and horizontal scaling; leaving you to focus on what matters: your code.

Happy Building!

### What to Explore Next

* **Environments** - Railway lets you create parallel, identical environments for PRs/testing.
* **Observability Dashboard** - Railway's built-in observability dashboard offers a customizable view of metrics, logs, and usage in one place.
* **Project Members** - Adding members to your projects is as easy as sending them an invite link.
* **Staged Changes** - When you make changes to your Railway project, such as adding or removing components and configurations, these updates will be gathered into a changeset for you to review and apply.

### Join the Community

Chat with Railway members, ask questions, and hang out in our Discord community with fellow builders! We'd love to have you!