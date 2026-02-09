# Goodbye REST. Hello... what?

REST is dead in an agentic world. What should an alternative look like?

This was born out of a [Blog](https://daniel.bryar.com.au/posts/2026/02/goodbye-rest-hello-cqrs/) where I posted that REST, while easy for humans to understand, is no good for agentic interaction. For that we have MCP.

But why maintain two separate contracts for your two distinct audiences? 

Surely there is a way we can make both human (developer) and agent interactions use the same mechanics for API interactions.

Here is a specification that I think is suitable for both human and agentic developers (both to deliver _and_ consume) with first class support for the incoming swarm of bots that will be pushing and pulling data in the near future. But I am only one person, and these types of specifications can only get better with the input of others.

Feel free to contribute with either an issue or an MR and from that, I'm planning to change the way I write my tooling; no more first and second class audiences, and no more REST.
