const { contextBridge } = require("electron");
const { promisify } = require("util");
var grpc = require("@grpc/grpc-js");
const daemonM = require("../daemon/schema/daemon_pb");
const daemonS = require("../daemon/schema/daemon_grpc_pb");
const path = require("path");

function get_socket_path() {
  if (process.env.XDG_RUNTIME_DIR) {
    return path.join(
      process.env.XDG_RUNTIME_DIR,
      "anysphere",
      "anysphere.sock"
    );
  } else if (process.env.XDG_CONFIG_HOME) {
    return path.join(
      process.env.XDG_CONFIG_HOME,
      "anysphere",
      "run",
      "anysphere.sock"
    );
  } else if (process.env.HOME) {
    return path.join(process.env.HOME, ".anysphere", "run", "anysphere.sock");
  } else {
    process.stderr(
      "$HOME or $XDG_CONFIG_HOME or $XDG_RUNTIME_DIR not set! Cannot find socket, aborting. :("
    );
    throw new Error("$HOME or $XDG_CONFIG_HOME or $XDG_RUNTIME_DIR not set!");
  }
}

function get_socket_address() {
  return "unix://" + get_socket_path();
}

const daemonClient = new daemonS.DaemonClient(
  get_socket_address(),
  grpc.credentials.createInsecure()
);

console.log(`SOCKET ADDRESS: ${get_socket_address()}`);

const FAKE_DATA = process.env.ASPHR_FAKE_DATA === "true";

contextBridge.exposeInMainWorld("send", async (to, message) => {
  if (FAKE_DATA) {
    return true;
  }
  const request = new daemonM.SendMessageRequest();
  request.setName(to);
  request.setMessage(message);
  const sendMessage = promisify(daemonClient.sendMessage).bind(daemonClient);
  try {
    const response = await sendMessage(request);
    return true;
  } catch (e) {
    console.log(`error in send: ${e}`);
    return false;
  }
});

contextBridge.exposeInMainWorld("getNewMessages", async () => {
  if (FAKE_DATA) {
    return [
      {
        id: "1",
        from: "Alice",
        to: "me",
        message: "hello!\n\nthis is a test message\n\nbest,\nalice",
        timestamp: new Date(),
      },
      {
        id: "2",
        from: "Bob",
        to: "me",
        message: "hi",
        timestamp: new Date(),
      },
    ];
  }
  const request = new daemonM.GetNewMessagesRequest();
  const getNewMessages = promisify(daemonClient.getNewMessages).bind(
    daemonClient
  );
  try {
    const response = await getNewMessages(request);
    const lm = response.getMessagesList();
    const l = lm.map((m) => {
      return {
        id: m.getId(),
        from: m.getFrom(),
        to: m.getTo(),
        message: m.getMessage(),
        timestamp: m.getTimestamp(),
      };
    });
    return l;
  } catch (e) {
    console.log(`error in getNewMessages: ${e}`);
    return [];
  }
});

contextBridge.exposeInMainWorld("getAllMessages", async () => {
  if (FAKE_DATA) {
    return [
      {
        id: "1",
        from: "Alice",
        to: "me",
        message: "hello",
        timestamp: new Date(),
      },
      {
        id: "2",
        from: "Bob",
        to: "me",
        message: "hi",
        timestamp: new Date(),
      },
      {
        id: "3",
        from: "Bob",
        to: "me",
        message: "hi this is my second message",
        timestamp: new Date(),
      },
      {
        id: "4",
        from: "Bob",
        to: "me",
        message: "hi this is my first message",
        timestamp: new Date(),
      },
    ];
  }
  const request = new daemonM.GetAllMessagesRequest();
  const getAllMessages = promisify(daemonClient.getAllMessages).bind(
    daemonClient
  );
  try {
    const response = await getAllMessages(request);
    const lm = response.getMessagesList();
    const l = lm.map((m) => {
      return {
        id: m.getId(),
        from: m.getFrom(),
        to: m.getTo(),
        message: m.getMessage(),
        timestamp: m.getTimestamp(),
      };
    });
    return l;
  } catch (e) {
    console.log(`error in getAllMessages: ${e}`);
    return [];
  }
});