//
// Copyright 2022 Anysphere, Inc.
// SPDX-License-Identifier: GPL-3.0-only
//

import * as React from "react";
import Modal from "./Modal";
import { Friend } from "../types";
import { SelectableList, ListItem } from "./SelectableList";

function FriendsModal({
  onClose,
  onAddFriend,
}: {
  onClose: () => void;
  onAddFriend: (_: string) => void;
}) {
  const [friendname, setFriendname] = React.useState<string>("");
  const [friends, setFriends] = React.useState<Friend[]>([]);

  React.useEffect(() => {
    (window as any).getFriendList().then((friends: Friend[]) => {
      setFriends(friends);
    });
  }, []);

  const addFriend = React.useCallback(() => {
    if (friendname === "") {
      console.log("ERR");
    } else {
      if (friends.find((f) => f.name === friendname && f.status === "added")) {
        console.log("Already added friend...");
      } else {
        onAddFriend(friendname);
      }
    }
  }, [onAddFriend, friendname]);

  React.useEffect(() => {
    const handler = (event: any) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addFriend();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addFriend]);

  let friendsList: ListItem<{
    type: "add" | "friend" | "none";
    name: string;
  }>[] = friends
    .filter((friend) => friend.status === "added")
    .map((friend, index) => ({
      id: `friend-${index}`,
      action: () => {},
      data: {
        type: "friend",
        name: friend.name,
      },
    }));
  if (friendsList.length === 0) {
    friendsList = [
      {
        id: "no-friends",
        action: () => {},
        data: {
          type: "none",
          name: "(No friends.)",
        },
      },
    ];
  }

  let invitations: ListItem<{
    type: "add" | "friend" | "none";
    name: string;
  }>[] = friends
    .filter((friend) => friend.status === "initiated")
    .map((friend, index) => ({
      id: `invitation-${index}`,
      action: () => {
        onAddFriend(friend.name);
      },
      data: {
        type: "friend",
        name: friend.name,
      },
    }));
  if (invitations.length === 0) {
    invitations = [
      {
        id: "no-invitations",
        action: () => {},
        data: {
          type: "none",
          name: "(No pending invitations.)",
        },
      },
    ];
  }

  let selectableOptions: (
    | ListItem<{ type: "add" | "friend" | "none"; name: string }>
    | string
  )[] = [
    "New",
    {
      id: "add-friend",
      action: () => {},
      data: {
        type: "add",
        name: "",
      },
    },
    "Pending invitations",
    ...invitations,
    "Friends",
    ...friendsList,
  ];

  return (
    <Modal onClose={onClose}>
      <SelectableList
        items={selectableOptions}
        searchable={true}
        globalAction={() => {}}
        onRender={({ item, active }) => {
          if (typeof item === "string") {
            return (
              <div>
                <div className="text-asbrown-light unselectable text-xs pt-2">
                  {item}
                </div>
                <hr className="border-asbrown-100" />
              </div>
            );
          }
          if (item.data.type === "add") {
            return (
              <div
                className={`p-2 flex flex-row text-asbrown-dark gap-2 ${
                  active ? "bg-asbeige" : ""
                }`}
              >
                <div className="unselectable text-sm ">Add contact:</div>
                <input
                  autoFocus={active}
                  type="text"
                  value={friendname}
                  onChange={(e) => {
                    setFriendname(e.target.value);
                  }}
                  placeholder="What you would like to call them?"
                  className="bg-red-100/[0] focus:border-none focus:border-red-500 flex-grow
              focus:outline-none text-sm
              focus:ring-0
              placeholder:text-asbrown-200"
                />
                <button
                  className="unselectable px-2 rounded-md bg-asbrown-100 text-asbrown-light "
                  onClick={addFriend}
                  disabled={friendname.length === 0}
                >
                  <div className="codicon codicon-arrow-right"></div>
                </button>
              </div>
            );
          }
          if (item.data.type === "friend") {
            return (
              <div
                className={`py-1 text-asbrown-dark px-2 ${
                  active ? "bg-asbeige" : ""
                }`}
              >
                <div className="text-sm">{item.data.name}</div>
              </div>
            );
          }
          if (item.data.type === "none") {
            return (
              <div className="text-asbrown-300 unselectable text-xs text-center py-2">
                {item.data.name}
              </div>
            );
          }
          return <div></div>;
        }}
      />
      {/* <div className="grid">
        <div className="text-asbrown-light unselectable text-xs pt-2">New</div>
        <hr className="border-asbrown-100" />
        <div className={`mt-1 ${selected === 0 ? "bg-asbeige" : ""}`}>
          <div className="p-2 flex flex-row gap-2">
            <div className="unselectable text-sm">Add contact:</div>
            <input
              autoFocus={selected === 0}
              type="text"
              value={friendname}
              onChange={(e) => {
                setFriendname(e.target.value);
              }}
              placeholder="What you would like to call them?"
              className="bg-red-100/[0] focus:border-none focus:border-red-500 flex-grow
              focus:outline-none text-sm
              focus:ring-0
              placeholder:text-asbrown-200"
            />
            <button
              className="unselectable px-2 rounded-md bg-asbrown-100 text-asbrown-light "
              onClick={addFriend}
              disabled={friendname.length === 0}
            >
              <div className="codicon codicon-arrow-right"></div>
            </button>
          </div>
        </div>
        <div className="text-asbrown-light unselectable text-xs pt-2">
          Pending invitations
        </div>
        <hr className="border-asbrown-100" />
        {friends
          .filter((friend) => friend.status === "initiated")
          .map((friend, index) => (
            <div
              className={`mt-1 text-sm py-1 px-2 ${
                selected === index + 2 ? "bg-gray-100" : ""
              }`}
              key={index}
            >
              {friend.name}
            </div>
          ))}
        {friends.filter((friend) => friend.status === "initiated").length ===
          0 && (
          <div className="text-asbrown-300 unselectable text-xs text-center pt-1">
            (No pending invitations.)
          </div>
        )}
        <div className="text-asbrown-light text-xs unselectable pt-2">
          Friends
        </div>
        <hr className="border-asbrown-100" />
        {friends
          .filter((friend) => friend.status === "added")
          .map((friend, index) => (
            <div
              className={`mt-1 text-sm py-1 px-2 ${
                selected === index + 2 ? "bg-gray-100" : ""
              }`}
              key={index}
            >
              {friend.name}
            </div>
          ))}
      </div> */}
    </Modal>
  );
}

export function InitFriendModal({
  onClose,
  friend,
  friendKey,
  onPasteKey,
}: {
  onClose: () => void;
  friend: string;
  friendKey: string;
  onPasteKey: (_: string) => void;
}) {
  const [theirkey, setTheirkey] = React.useState<string>("");

  const submitPaste = React.useCallback(() => {
    onPasteKey(theirkey);
  }, [onPasteKey, theirkey]);

  React.useEffect(() => {
    const handler = (event: any) => {
      if (event.key === "Enter") {
        submitPaste();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitPaste]);

  return (
    <Modal onClose={onClose}>
      <div className="grid">
        <div className="text-center font-bold">{friend}</div>
        <div className="text-sm text-center unselectable py-1">
          You're almost done adding {friend} as a friend!
        </div>
        <div className="grid">
          <div className="text-sm unselectable">
            1. Send the following key to {friend}.
          </div>
          <div className="flex flex-row my-2 gap-1 justify-center">
            <code className="justify-self-center bg-asbeige py-1 px-2 rounded-md">
              {friendKey}
            </code>
            <button
              className="unselectable px-2 py-0 rounded-md bg-asbrown-100 text-asbrown-light"
              onClick={() => (window as any).copyToClipboard(friendKey)}
            >
              <div className="codicon codicon-copy"></div>
            </button>
          </div>
        </div>
        <div className="grid">
          <div className="text-sm unselectable">
            2. Ask {friend} to add you as a friend and send you their key.
          </div>
          <div className="flex flex-row my-2 gap-1 justify-center mx-9">
            <input
              autoFocus
              type="text"
              value={theirkey}
              onChange={(e) => {
                setTheirkey(e.target.value);
              }}
              placeholder="Paste their key here"
              className="bg-red-100/[0] px-2 placeholder:text-asbrown-200 font-mono focus:outline-none
              focus:ring-0 border-b-2 flex-grow border-asbrown-100"
            />
            <button
              className="unselectable px-2 py-0 rounded-md bg-asbrown-100 text-asbrown-light"
              onClick={submitPaste}
            >
              <div className="codicon codicon-check"></div>
            </button>
          </div>
        </div>
        <div className="text-xs text-asbrown-dark pt-1">
          Privacy details, because details matter: This key can be thought of as
          your public key — hence, it is okay for you to send it over an
          unencrypted channel, or show it to others! However, if you, say, make
          a public tweet containing this key and your friend's name, the whole
          world would reasonably be able to conclude that you are communicating
          with them. Ideally, you would share this key in person, but if you
          already have a communication channel open with {friend}, you might as
          well use that (because you already have the channel open, so sending
          one additional message doesn't change anything). We are working on a
          way to improve this flow, so stay tuned.
        </div>
      </div>
    </Modal>
  );
}

export default FriendsModal;
