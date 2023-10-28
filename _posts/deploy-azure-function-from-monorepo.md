---
title: 'How to deploy an Azure Function from a monorepo'
date: '10/27/2023'
coverImage: 'postImages/deploy-azure-function-from-monorepo/layout.png'
slug: 'deploy-azure-function-from-monorepo'
tags: 'monorepo*azure-function'
---

# How to deploy an Azure Function from a monorepo

![Layout](/postImages/deploy-azure-function-from-monorepo/layout.png)

Azure Function Core Tools is a powerful tool for building and deploying Azure Functions. It allows us to run our functions locally and deploy them to Azure. Unfortunately, it does not support monorepos out of the box. In this post, we will explore how to deploy an Azure Function from a monorepo that uses Yarn workspaces.

### The problem

Imagine you have a monorepo with several Azure Functions and a shared code package that is a dependency for all the Azure Functions. If you try to deploy one of the functions with Azure Function Core Tools, the deployment will succeed, but the function will not work. Furthermore, since Azure Function Core Tools is not aware of the yarn.lock file in the root folder of the monorepo, it will use npm to install dependencies. This can lead to non-deterministic behavior as it does not use the yarn.lock file. Some users have raised concerns about this issue [here](https://github.com/microsoft/vscode-azurefunctions/issues/2521) and [here](https://github.com/Azure/azure-functions-host/issues/6609).

Let's walk through a practical example to better understand the problem and why it occurs. If you want to follow along, you can find the code I'm going to use [here](https://github.com/tomasgil123/deploy-azure-function-from-monorepo).

### Deploying a function using Azure function core tools

First, ensure that you have the following tools installed on your computer:

- [Azure function core tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=macos%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-typescript)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- Visual studio code

Then, download the code from the repository and install the dependencies:

```
git clone https://github.com/tomasgil123/deploy-azure-function-from-monorepo

cd deploy-azure-function-from-monorepo

yarn install
```

Now, let's create a function app in your Azure account. You can use Azure Functions Core Tools within Visual Studio Code to do this:

![CreateFunctionApp](/postImages/deploy-azure-function-from-monorepo/create_function_app_in_azure.png)

Follow the steps provided by the extension. You will need to log in to your Azure account, select the subscription, resource group, and function app name.

With the function app created, let's deploy our Azure Function using Azure Function Core Tools. Open the terminal and run the following command:

```
func azure functionapp publish <functionAppName>
```

The endpoint of the function will look something like this: https://github-example.azurewebsites.net/api/{function-name}?code={code}

The "code" parameter is used for authentication. You can find it in the Azure portal. Navigate to your function app, select the deployed function, and click "Get function URL" to copy the code parameter.

Notice that when you attempt to make a request to the endpoint, you encounter a 500 error. If you check the logs in the Azure portal, you'll see the following error:

![MissingModule](/postImages/deploy-azure-function-from-monorepo/missing_module.png)

This error occurs because Azure Function Core Tools is not aware that the entire project is a monorepo. When it tries to build the Azure Function, it treats the shared package called common as a regular dependency and attempts to install it from npm, which fails and prevents the function from working.

### Manual Build Process

Unfortunately, we can't rely on Azure Function Core Tools to handle the build process for us in a monorepo. Azure provides alternative deployment methods, such as [zip deployment](https://learn.microsoft.com/en-us/azure/azure-functions/deployment-zip-push), where we create a zip file and deploy it. This approach gives us control over the build process that is what we need.

One important consideration is the folder structure inside the zip file. For TypeScript projects like the one we're working on, the folder structure should resemble this:

```
<project_root>/
 | - .vscode/
 | - dist/
 | - node_modules/
 | - src/
 | | - functions/
 | | | - myFirstFunction.ts
 | | | - mySecondFunction.ts
 | - test/
 | | - functions/
 | | | - myFirstFunction.test.ts
 | | | - mySecondFunction.test.ts
 | - .funcignore
 | - host.json
 | - local.settings.json
 | - package.json
 | - tsconfig.json
```

Notice that we need to include the `node_modules` folder inside the zip file. In a monorepo, dependencies used by multiple packages are included in the `node_modules` folder in the root directory. To make the function work, we must ensure that every dependency the function uses is located in the `node_modules` inside the function folder. To achieve this, modify the root package.json as follows:

```
{
    "name": "deploy-azure-function-from-monorepo",
    "private": true,
    "workspaces": {
      "packages": ["packages/*"],
      "nohoist": [
        "azure-function-a/**"
      ]
    }
}
```

Now, run `yarn install` again. You'll notice that the `node_modules` folder includes all the dependencies the function uses, including the package named `common`:

![NodeModules](/postImages/deploy-azure-function-from-monorepo/node_modules.png)

### Compiling TypeScript Code, Creating the Zip File, and Deploying

As you might noticed, when you do a zip deployment of a function wirtten in typescript you must incluide a `dist` folder. This folder includes the compiled javascript code of the function. We can use the `tsc` command to compile the typescript code.
Once we have the `dist` folder we are ready to create the zip file. We will group all commands we need to create the zip file in a single bash script called `deploy.sh` in order to make the process easier.
For deploying the function we will use Azure CLI. Our bash script will look like this:

As you may have noticed, when performing a zip deployment of a TypeScript-based function, you must include a `dist` folder. This folder contains the compiled JavaScript code of the function. We can use the `tsc` command to compile the TypeScript code. Once we have the `dist` folder, we can create the zip file. Let's consolidate all the required commands into a single Bash script called `deploy.sh` to simplify the process:

```
#!/bin/bash

# Check if the user is logged into Azure
if az account show &>/dev/null; then
  echo "Azure CLI is already logged in."
else
  echo "Azure CLI is not logged in. Please log in to your Azure account."
  az login
fi

# Ensure the script is always executable
chmod +x "$0"

# Install production dependencies using yarn
yarn install --force

# we create a dist folder if not present
mkdir -p build

# Create a deployment package (ZIP file) in the dist folder
zip -r build/azure-function-1.zip .

# Deploy the package to Azure Functions
az functionapp deployment source config-zip --src ./build/azure-function-1.zip --name {functionAppName} --resource-group {resourceGroup} --subscription {subscriptionId}
```

Finally, we will add a script to the function package.json file so we can run the whole process easily. The package.json file will look like this:

```
{
  "name": "azure-function-a",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "prestart": "npm run build",
    "start": "func start --typescript",
    "test": "echo \"No tests yet...\"",
    "deploy": "tsc && bash deploy.sh"
  },
  "dependencies": {
    "common": "1.0.0"
  },
  "devDependencies": {
    "@azure/functions": "^3.0.0",
    "azure-functions-core-tools": "^4.x",
    "@types/node": "18.x",
    "typescript": "^4.0.0"
  }
}
```

### Conclusion

If our project has a monorepo structure and some of its packages are azure functions, we can't rely on Azure function core tools to deploy them. We need to create the build manually and then deploy zip deployment.
