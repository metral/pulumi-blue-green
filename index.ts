import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

// Create a deployment.
const appLabelsV1 = { app: "blue" };
const deploymentV1 = new k8s.apps.v1.Deployment("app-v1", {
	spec: {
		selector: { matchLabels: appLabelsV1 },
		replicas: 3,
		template: {
			metadata: { labels: appLabelsV1 },
			spec: {
				containers: [{
					name: "app",
					image: "gcr.io/cloud-solutions-images/app:current",
                    ports: [{containerPort: 8080}],
					livenessProbe: {httpGet: {path: "/version", port: 8080 }},
					readinessProbe: {httpGet: {path: "/version", port: 8080 }},
					lifecycle: {
						preStop: {
							exec: {command: ["/bin/bash", "-c", "sleep 5"]},
						},
					}
				}],
			},
		}
	}
});

// Create a service load balancer.
const service = new k8s.core.v1.Service("app", {
    spec: {
        selector: appLabelsV1,
        ports: [{ port: 80, targetPort: 8080 }],
        type: "LoadBalancer",
    },
});

// Export the URL for the service.
const address = service.status.loadBalancer.ingress[0].ip;
const port = service.spec.ports[0].port;
export const url = pulumi.interpolate`http://${address}:${port}`;
