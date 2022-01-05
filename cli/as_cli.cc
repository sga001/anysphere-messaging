/*******************************************************************************
 * CLI - A simple command line interface.
 * Copyright (C) 2016-2021 Daniele Pallastrelli
 *
 * Boost Software License - Version 1.0 - August 17th, 2003
 *
 * Permission is hereby granted, free of charge, to any person or organization
 * obtaining a copy of the software and accompanying documentation covered by
 * this license (the "Software") to use, reproduce, display, distribute,
 * execute, and transmit the Software, and to prepare derivative works of the
 * Software, and to permit third-parties to whom the Software is furnished to
 * do so, all subject to the following:
 *
 * The copyright notices in the Software and this entire statement, including
 * the above license grant, this restriction and the following disclaimer,
 * must be included in all copies of the Software, in whole or in part, and
 * all derivative works of the Software, unless such copies or derivative
 * works are solely in the form of machine-executable object code generated by
 * a source language processor.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE
 * FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 ******************************************************************************/

#include "as_cli.h"

using namespace cli;

// TODO (sualeh): extract the menu out.
// auto make_anysphere_menu() -> Menu

int main() {
  // setup cli

  Message message_to_send;
  Friend friend_to_add;

  auto rootMenu = make_unique<Menu>("anysphere");

  rootMenu->Insert(
      "menu", [](std::ostream &out) { out << "Hello, world\n"; },
      "The Anysphere menu");
  rootMenu->Insert(
      "color",
      [](std::ostream &out) {
        out << "Colors ON\n";
        SetColor();
      },
      "Enable colors in the cli");
  rootMenu->Insert(
      "nocolor",
      [](std::ostream &out) {
        out << "Colors OFF\n";
        SetNoColor();
      },
      "Disable colors in the cli");

  /* Messaging interface

  Use the two different options to send a message to a friend.
  */
  rootMenu->Insert(
      "message",
      [&](std::ostream &out, string friend_name, string message) {
        Message msg(message, friend_name);
        msg.send();

        out << "Message sent to " << friend_name << ": " << message << "\n";
      },
      StrCat("Open a text menu to message a friend.",
             "You can also use the command line interface with `message` to "
             "send messages.",
             "Interface `message ${friend} ${message}`"));

  auto messageMenu = make_unique<Menu>("message");
  messageMenu->Insert(
      "friend",
      [&](std::ostream &out, string friend_name) {
        out << "Send a message to friend: " << friend_name << " :)\n";

        message_to_send.friend_ = friend_name;
        if (message_to_send.complete()) {
          out << "Message sent to " << friend_name << ": "
              << message_to_send.msg_ << "\n";
          message_to_send.send();
        } else {
          out << "Now type `write` with your message.\n";
          out << "Press Esv or type 'anysphere' to return to the menu.\n";
        }
      },
      "Open a text menu to message a friend.");
  messageMenu->Insert(
      "write",
      [&](std::ostream &out, string message) {
        out << "Send a message to friend: " << message << " :\n";

        message_to_send.msg_ = message;
        if (message_to_send.complete()) {
          out << "Message sent to " << message_to_send.friend_ << ": "
              << message_to_send.msg_ << "\n";
          message_to_send.send();
          out << "Type 'anysphere' to go to your main inbox.\n";
        } else {
          out << "Now type `friend:` with your friend name.\n";
        }
      },
      "Open a text menu to message a friend.");

  /* Register interface
   */
  rootMenu->Insert(
      "register",
      [&](std::ostream &out, string name, string public_key,
          string private_key) {
        Profile profile(name, public_key, private_key);
        profile.add();

        out << "Profile registered: " << name << " :\n";
      },
      "Register a profile! Parameters: name, public_key, private_key");

  /* Inbox interface
   */
  auto inboxMenu = make_unique<Menu>("inbox");
  inboxMenu->Insert(
      "friend",
      [](std::ostream &out, string friend_name) {
        out << StrCat("Showing (the last 15) messages from your friend ",
                      friend_name, "\n");

        out << "--------------------------------\n";
        auto messages = read_friend_messages_from_file(friend_name, 15);
        for (const auto &message : messages) {
          out << StrCat(message["from"].get<string>(), ": \n",
                        "time: ", message["timestamp"].get<string>(), "\n",
                        message["message"].get<string>(), "\n\n",
                        "--------------------------------\n");
        }
        out << "Type 'anysphere' to go to your main inbox.\n ";
        // go to the main inbox.
      },
      "Show the messages from a friend");
  inboxMenu->Insert(
      "names",
      [](std::ostream &out) {
        out << "Showing all your friends:\n\n";
        auto friends = read_friends_from_file();
        for (const auto &friend_ : friends) {
          out << friend_["name"].get<string>() << "\n";
        }
        if (friends.empty()) {
          out << "You have no friends :(\n";
        }
        if (friends.size() == 1) {
          out << "YOU have 1 friend :)\n";
        } else {
          out << StrCat("THERE YOUR ARE! YOU HAVE ", friends.size(),
                        " FRIENDS\n");
        }

        out << "Type 'anysphere' to go to your main inbox.\n ";
      },
      "Show all your friends");

  /* Friends interface
    You can add friends with the command "add-friend ${friend_name} ${friend
    public key}"
    You can also open the add-friend menu with "friend"
  */
  auto friendsMenu = make_unique<Menu>("friends");
  rootMenu->Insert(
      "add-friend",
      [&](std::ostream &out, string friend_name, int write_index,
          int read_index, string shared_key) {
        Friend friend_(friend_name, write_index, read_index, shared_key);
        friend_.add();
        out << StrCat("Adding friend ", friend_name, " with read_index ",
                      friend_.write_index_, " and write_index ",
                      friend_.read_index_, "\n");
        out << "Type 'anysphere' to go to your main inbox.\n ";
      },
      "Add a friend to your friends list! Params: friend_name, write_index, "
      "read_index, shared_key");
  // friendsMenu->Insert(
  //     "add-friend",
  //     [](std::ostream& out, string friend_name, string friend_public_key) {
  //       out << StrCat("Adding friend: ", friend_name,
  //                     " with public key: ", friend_public_key, "\n");
  //       out << "Type 'anysphere' to go to your main inbox.\n ";
  //       // go to the main inbox.
  //     },
  //     "Add a friend to your friends list");
  // friendsMenu->Insert(
  //     "name",
  //     [&](std::ostream& out, string friend_name) {
  //       friend_to_add.name_ = friend_name;
  //       if (friend_to_add.complete()) {
  //         out << StrCat("Adding friend: ", friend_name,
  //                       " with public key: ", friend_to_add.public_key_,
  //                       "\n");
  //         friend_to_add.add();
  //         out << "Type 'anysphere' to go to your main inbox.\n ";
  //         // go to the main inbox.
  //       } else {
  //         out << "Now type `public-key` with your friend's public key.\n";
  //         out << "Press Esv or type 'anysphere' to return to the menu.\n";
  //       }
  //     },
  //     "Set the name of your friend");
  // friendsMenu->Insert(
  //     "public-key",
  //     [&](std::ostream& out, string friend_public_key) {
  //       friend_to_add.public_key_ = friend_public_key;
  //       if (friend_to_add.complete()) {
  //         out << StrCat("Adding friend: ", friend_to_add.name_,
  //                       " with public key: ", friend_to_add.public_key_,
  //                       "\n");
  //         friend_to_add.add();
  //         out << "Type 'anysphere' to go to your main inbox.\n ";
  //         // go to the main inbox.
  //       } else {
  //         out << "Now type `name` with your friend's name.\n";
  //         out << "Press Esv or type 'anysphere' to return to the menu.\n";
  //       }
  //     },
  //     "Set the public key of your friend");

  // Just add all the submenus to the root menu
  rootMenu->Insert(std::move(messageMenu));
  rootMenu->Insert(std::move(inboxMenu));
  // rootMenu->Insert(std::move(friendsMenu));

  Cli cli(std::move(rootMenu));
  SetColor();

  // global exit action
  cli.ExitAction([](auto &out) {
    out << "Goodbye! We hope you are enjoying anysphere!\n";
  });

  MainScheduler scheduler;
  CliLocalTerminalSession localSession(cli, scheduler, std::cout, 200);
  localSession.ExitAction([&scheduler](auto &out) {
    out << "Closing App...\n";
    scheduler.Stop();
  });

  scheduler.Run();

  return 0;
}
