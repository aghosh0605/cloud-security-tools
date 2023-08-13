import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda"; // ES Modules import
import {
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";

const lambdaClient = new LambdaClient({ region: "ap-south-1" });
const iamClient = new IAMClient({ region: "ap-south-1" });

const checkLambdaPolicy = async () => {
  try {
    const params = {
      //   MasterRegion: "ap-south-1", // Optional: Specify a region if needed
      FunctionVersion: "ALL", // Retrieve all function versions
      //   Marker: "", // Omit this parameter for the first page
      MaxItems: 10, // Retrieve a maximum of 10 functions per request
    };

    const functionResponse = await lambdaClient.send(
      new ListFunctionsCommand(params)
    );
    const functions = functionResponse.Functions;

    for (const func of functions) {
      const roleArn = func.Role;

      // Get policies attached to the IAM role
      const input = {
        // ListAttachedRolePoliciesRequest
        RoleName: roleArn.split("/").pop(), // required
        // PathPrefix: "STRING_VALUE",
        // Marker: "STRING_VALUE",
        // MaxItems: Number("int"),
      };

      let roleInfoResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand(input)
      );
      const rolePolicies = roleInfoResponse.AttachedPolicies;

      const hasAdminAccess = rolePolicies.some(
        (policy) => policy.PolicyName === "AdministratorAccess"
      );

      if (hasAdminAccess) {
        console.log("  Attached Role: ", roleArn);
        console.log("  Warning: AdministratorAccess policy detected.");
      } else {
        console.log("  Attached Role: ", roleArn);
      }
    }
  } catch (err) {
    console.error("Error:", error);
  }
};

await checkLambdaPolicy();
