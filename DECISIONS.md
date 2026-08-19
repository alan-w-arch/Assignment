# DECISIONS

## 1. Why this ingestion strategy?
Instead of using one direct approach for acquiring the jobs data, I added a source adapter interface where I provided multiple public job APIs. This means that if one source fails, the system can retry it and then use another available source to fetch the data.

I also added a sandbox interface where different common blocking and failure scenarios can be recreated and tested, such as rate limits, timeouts, CAPTCHA/challenge situations, server errors, and other problems that can happen when fetching job data.

In addition to this, I added a separate button for direct fetching through Apify. This is the preferred approach for getting live LinkedIn job data because Apify handles the external acquisition process through its Actor, rather than my application directly accessing LinkedIn. This gives the application a separate and more reliable acquisition path while keeping the public APIs available as alternative sources.

## 2. Time-limit trade-off
Due to the limited time available for completing the assignment, I did not integrate multiple Apify Actors as a pool for fetching job data. I focused only on LinkedIn because it was the main source I wanted to demonstrate and it was not practical to integrate several Actors within the available time.

If I had more time, I would have added multiple Apify Actors and used them as additional sources for job acquisition. I would also have stored the fetched jobs in a database instead of only fetching them when requested.

## 3. AI usage
I used AI mainly to help with the implementation and UI changes of the project. I also used it to help create the Sandbox, which demonstrates different blocking and failure scenarios that can happen when fetching job data.

The Sandbox allows me to test scenarios such as different types of blocking, rate limits, timeouts, CAPTCHA/challenge situations, and other failures. It also shows the risk level of trying each scenario, which helped me demonstrate how the system should respond to these situations.

I also used AI during the development process to make changes and improvements to the implementation and interface, while I reviewed and tested the resulting functionality myself.
