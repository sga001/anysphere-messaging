
#include "anysphere.hpp"

#include "transmitter.hpp"

int main(int argc, char** argv) {
  std::string server_address(SERVER_ADDRESS);

  auto socket_address = string("");
  auto config_file_address = string("");

  vector<string> args(argv + 1, argv + argc);
  string infname, outfname;

  // Loop over command-line args
  for (auto i = args.begin(); i != args.end(); ++i) {
    if (*i == "-h" || *i == "--help") {
      std::cout << "Syntax: daemon -s <server_address> -d <socket_address>"
                   " -c <config_file_address>"
                << std::endl;
      std::cout << "  -s <server_address>  Address to listen on (default: "
                << server_address << ")" << std::endl;
      std::cout << "  -d <socket_address>  Address of socket (default: "
                << socket_address << ")" << std::endl;
      std::cout
          << "  -c <config_file_address>  Address of config file (default: "
          << config_file_address << ")" << std::endl;
      return 0;
    } else if (*i == "-s") {
      server_address = *++i;
    } else if (*i == "-d") {
      socket_address = *++i;
    } else if (*i == "-c") {
      config_file_address = *++i;
    }
  }

  if (socket_address == "") {
    socket_address = get_socket_path().string();
  }
  if (config_file_address == "") {
    config_file_address = get_config_file_address().string();
  }

  Config config(config_file_address);

  const Crypto crypto;

  // remove the socket file first
  remove(socket_address.c_str());

  // make it a socket address!
  socket_address = StrCat("unix://", socket_address);

  // connect to the anysphere servers
  cout << "Client querying server address: " << server_address << std::endl;
  shared_ptr<grpc::Channel> channel =
      grpc::CreateChannel(server_address, grpc::InsecureChannelCredentials());
  unique_ptr<asphrserver::Server::Stub> stub =
      asphrserver::Server::NewStub(channel);

  // TODO: VERIFY AND MAKE SURE CRYPTO, CONFIG, STUB ARE ALL THREADSAFE!!!!!
  Transmitter transmitter(crypto, config, stub);

  // set up the daemon rpc server
  auto daemon = DaemonRpc(crypto, config, stub);
  grpc::ServerBuilder builder;
  builder.AddListeningPort(socket_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&daemon);

  // start the daemon rpc server
  auto daemon_server = unique_ptr<grpc::Server>(builder.BuildAndStart());

  // keep the duration in chrono for thread sleeping.
  constexpr auto duration = absl::Milliseconds(5000);

  while (true) {
    absl::SleepFor(duration);
    // check for new ui write:

    // do a round
    std::cout << "Client round" << std::endl;

    // receive and then send! it is important! 2x speedup
    transmitter.retrieve_messages();
    transmitter.send_messages();

    // sleep for 100ms
  }

  return 0;
}
