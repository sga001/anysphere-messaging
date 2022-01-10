#pragma once

#include <grpcpp/grpcpp.h>

#include "as_scheduler.hpp"
#include "asphr/asphr.hpp"
#include "cli/cli.h"
#include "cli/clifilesession.h"
#include "cli/clilocalsession.h"
#include "client/client_lib/client_lib.hpp"
#include "schema/daemon.grpc.pb.h"

using MainScheduler = as_cli::AnysphereScheduler;

using std::cin;
using std::make_unique;

// The message struct to store and send messages.
struct Message {
 public:
  Message() = default;
  Message(const string& msg, const string& friend_name)
      : msg_(msg), friend_(friend_name) {}
  Msg msg_;
  Name friend_;
  absl::Time time_;

  bool complete() const { return !message_is_empty() && !friend_is_empty(); }
  void set_time() { time_ = absl::Now(); }
  void send(unique_ptr<asphrdaemon::Daemon::Stub>& stub);

  void clear() {
    msg_.clear();
    friend_.clear();
  }

 private:
  bool message_is_empty() const { return msg_.empty(); }
  bool friend_is_empty() const { return friend_.empty(); }
};

// The friend struct to store the name and public key of a friend.
// When a friend is complete we can add it to the config
struct Friend {
 public:
  Friend() = default;
  Friend(const string& name, const int& write_index, const int& read_index,
         const string& shared_key)
      : name_(name),
        write_index_(write_index),
        read_index_(read_index),
        shared_key_(shared_key) {}
  Name name_;
  absl::Time time_;
  Name name;
  int write_index_ = -1;
  int read_index_ = -1;
  string shared_key_;

  void set_time() { time_ = absl::Now(); }
  void add();
  void clear() { name_.clear(); }
  bool complete() const;

 private:
  bool name_is_empty() const { return name_.empty(); }
  bool write_index_is_empty() const { return write_index_ == -1; }
  bool read_index_is_empty() const { return read_index_ == -1; }
  bool shared_key_is_empty() const { return shared_key_.empty(); }
};

struct Profile {
 public:
  Profile(const string& name, const string& public_key,
          const string& private_key)
      : name_(name), public_key_(public_key), private_key_(private_key) {}
  Name name_;
  PublicKey public_key_;
  PrivateKey private_key_;
  absl::Time time_;

  void add(unique_ptr<asphrdaemon::Daemon::Stub>& stub);

  void set_time() { time_ = absl::Now(); }
  void clear() {
    name_.clear();
    public_key_.clear();
    private_key_.clear();
  }
  bool complete() const {
    return !name_is_empty() && !public_key_is_empty() &&
           !private_key_is_empty();
  }

 private:
  bool name_is_empty() const { return name_.empty(); }
  bool public_key_is_empty() const { return public_key_.empty(); }
  bool private_key_is_empty() const { return private_key_.empty(); }
};
