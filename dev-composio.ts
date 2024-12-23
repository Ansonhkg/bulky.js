import { Composio } from "composio-core";
import { OpenAI } from "openai";
import { OpenAIToolSet } from "composio-core";


const client = new Composio({ apiKey: "xxx" });

// const connections = await client.connectedAccounts.list({})

// console.log("connections:", connections);
// process.exit();

// -- initialise
// const entity = await client.getEntity("Anson");
// const connection = await entity.initiateConnection({ appName: 'github' });

// console.log(`Open this URL to authenticate: ${connection.redirectUrl}`);
// client.actions.execute({
//   actionName: ""
// });

// process.exit();

// -- execute
const openai_client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const composio_toolset = new OpenAIToolSet();

const tools = await composio_toolset.getTools({
  actions: ["GITHUB_STAR_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER"]
});

const instruction = "Star the repo composiohq/composio on GitHub";

const response = await openai_client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: instruction }],
  tools: tools,
  tool_choice: "auto",
});

// console.log(response.choices[0].message);

const result = await composio_toolset.handleToolCall(response);
console.log(result);
