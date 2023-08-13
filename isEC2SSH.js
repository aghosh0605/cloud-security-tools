import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";

const REGION = "ap-south-1"; // For example, "us-east-1"
const ec2Client = new EC2Client({ region: REGION });

const findSSHPort = async () => {
  try {
    // Describe instances
    const instancesParams = {};

    const instancesResponse = await ec2Client.send(
      new DescribeInstancesCommand(instancesParams)
    );

    if (
      instancesResponse.Reservations &&
      instancesResponse.Reservations.length > 0
    ) {
      const instances = instancesResponse.Reservations.flatMap(
        async (reservation) => {
          const instances = reservation.Instances;
          for (const instance of instances) {
            console.log(`Instance ID: ${instance.InstanceId}`);
            console.log(`Instance State: ${instance.State.Name}`);
            // Describe security groups for the instance
            if (instance.SecurityGroups && instance.SecurityGroups.length > 0) {
              for (const securityGroup of instance.SecurityGroups) {
                console.log(`Security Group ID: ${securityGroup.GroupId}`);
                console.log("---------------------------------------------");
                // Describe security group rules
                const securityGroupParams = {
                  GroupIds: [securityGroup.GroupId],
                };

                const securityGroupResponse = await ec2Client.send(
                  new DescribeSecurityGroupsCommand(securityGroupParams)
                );
                if (
                  securityGroupResponse.SecurityGroups &&
                  securityGroupResponse.SecurityGroups.length > 0
                ) {
                  const securityGroupRules =
                    securityGroupResponse.SecurityGroups[0].IpPermissions;

                  const port22Open = securityGroupRules.some(
                    (rule) =>
                      rule.FromPort <= 22 &&
                      rule.ToPort >= 22 &&
                      rule.IpRanges.some(
                        (range) => range.CidrIp === "0.0.0.0/0"
                      )
                  );

                  console.log(
                    `Port 22 Open: ${port22Open} for ${instance.InstanceId}`
                  );
                } else {
                  console.log("No security groups found.");
                }
              }
            } else {
              console.log("No security groups found.");
            }
          }
        }
      );
    } else {
      console.log("No instances found.");
    }
  } catch (err) {
    console.error("Error:", error);
  }
};

await findSSHPort();
