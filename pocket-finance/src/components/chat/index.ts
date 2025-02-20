import { settings } from "@elizaos/core";
import readline from "readline";
import { Character } from "@elizaos/core";
import type { Content, UUID } from "@elizaos/core";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("SIGINT", () => {
  rl.close();
  process.exit(0);
});

// interface Message {
//   text: string;
// }
async function handleUserInput(input: string, agentId: string) {
  if (input.toLowerCase() === "exit") {
    rl.close();
    process.exit(0);
  }

  try {
    let serverPort = parseInt(settings.SERVER_PORT || "3000");
    // Try both ports if the first attempt fails
    const tryPort = async (port: number) => {
      const response = await fetch(
        `http://localhost:${port}/${agentId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: input,
            userId: "user",
            userName: "User",
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${text}`);
      }

      return response;
    };

    let response;
    try {
      response = await tryPort(serverPort);
    } catch (error) {
      // If first port fails, try the next port
      response = await tryPort(serverPort + 1);
    }

    const data = await response.json();
    data.forEach((message: Content) => console.log(`Agent: ${message.text}`));
  } catch (error) {
    console.error("Error:", error);
    console.log("Please make sure the agent is properly initialized and running.");
  }
}


export function startChat(characters: Character[]) {
  function chat() {
    console.log("Starting chat...");
    const agentId = characters[0].id;
    console.log("Agent ID:", agentId);
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    rl.question("You: ", async (input) => {
      await handleUserInput(input, agentId);
      if (input.toLowerCase() !== "exit") {
        chat(); // Loop back to ask another question
      }
    });
  }

  return chat;
}

