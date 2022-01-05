#include <gtest/gtest.h>
using testing::Types;

#include "server/src/account_manager.h"

template <typename T>
struct AccountManagerTest : public testing::Test {};

typedef Types<AccountManagerInMemory, AccountManagerPostgres> Implementations;

TYPED_TEST_SUITE(AccountManagerTest, Implementations);

TYPED_TEST(AccountManagerTest, Basic) {
  TypeParam account_manager;

  auto index = 1;
  auto public_key = "public_key";
  auto [auth_token, allocation] =
      account_manager.generate_account(public_key, index);

  // TODO: update this when we allow bigger allocations
  EXPECT_EQ(allocation.size(), 1);

  EXPECT_EQ(allocation[0], index);

  EXPECT_TRUE(account_manager.valid_index_access(auth_token, index));

  EXPECT_FALSE(account_manager.valid_index_access(auth_token, index + 1));

  EXPECT_FALSE(account_manager.valid_index_access(auth_token, index - 1));

  EXPECT_FALSE(account_manager.valid_index_access("", index));

  EXPECT_FALSE(account_manager.valid_index_access("public_key1", index));
  EXPECT_FALSE(account_manager.valid_index_access("public_ke", index));
}