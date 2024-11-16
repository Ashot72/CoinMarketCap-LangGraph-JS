# CoinMarketCap LangGraph JS
I have built an application where you can ask questions about cryptocurrencies to an LLM and receive replies using LangGraph.js

[LangGraph.js](https://langchain-ai.github.io/langgraphjs/) is a library for building stateful, multi-actor applications with LLMs, used to create agent and multi-agent workflows. Compared to other LLM frameworks, it offers these core benefits; cycles, controllability, and persistence.

![graph image](https://github.com/Ashot72/CoinMarketCap-LangGraph-JS/tree/main/public/CoinMarketCap_graph.png)

In this app, we created a LangGraph workflow using built-in and custom tools integrated with the [CoinMarketCap API](https://coinmarketcap.com/api/documentation/v1/#section/Authentication/). We defined our own states with the MessageAnnotation. The workflow is dynamically interrupted, as the app follows a human-in-the-loop (HITL) approach, requiring human intervention before proceeding with certain tasks.

We add tracing in [LangSmith](https://www.langchain.com/langsmith) to monitor model performance, trace execution flows, and evaluate LLM interactions, ensuring they operate efficiently and meet expectations.


To get started.
```
       # Clone the repository

         git clone https://github.com/Ashot72/CoinMarketCap-LangGraph-JS
         cd CoinMarketCap-LangGraph-JS

       # Create the .env file based on the .env.example.txt file and include the respective keys.
       
       # installs dependencies
         npm install

       # to start
         npm start
      
```

Go to [CoinMarketCap LangGraph JS Video](https://youtu.be/faosBOaERnU) page

Go to [CoinMarketCap LangGraph JS Description](https://ashot72.github.io/CoinMarketCap-LangGraph-JS/doc.html) page
