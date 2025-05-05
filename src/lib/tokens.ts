
  // Function to get Hedera account ID from EVM address
export async function getHederaAccountId(evmAddress: string) {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts?account.evmaddress=${evmAddress.toLowerCase()}`
      );
      const data = await response.json();
      if (data.accounts && data.accounts.length > 0) {
        return data.accounts[0].account; // Returns "0.0.12345"
      } else {
        throw new Error("Account not found");
      }
    } catch (error) {
      console.error("Error fetching account ID:", error);
      return null;
    }
  }
  
  // Function to get associated tokens for a Hedera account ID
  export async function getAssociatedTokens(accountId: string) {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens`
      );
      const data = await response.json();
      if (data.tokens) {
        return data.tokens?.map((token: { token_id: string }) => token.token_id); // Returns array like ["0.0.5795253"]
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching associated tokens:", error);
      return [];
    }
  }