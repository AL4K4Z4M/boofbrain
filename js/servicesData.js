/**
 * servicesData.js
 *
 * This file contains the data for the services page.
 * Each service object should have the following properties:
 * - title: The title of the service.
 * - description: A brief description of the service.
 * - url: The URL of the service.
 * - hostedBy: The name of the person or entity hosting the service.
 */

export const services = [
  {
    title: "My Awesome Service 1",
    description: "This is a description of my awesome service 1.",
    url: "/service1", // Example internal link
    hostedBy: "boofbrain"
  },
  {
    title: "Another Cool Service",
    description: "Learn more about this cool service that does cool things.",
    url: "https://example.com/service2", // Example external link
    hostedBy: "boofbrain"
  },
  {
    title: "Service Without a Link",
    description: "This service is coming soon and doesn't have a live URL yet.",
    url: "#", // Placeholder for services without a current link
    hostedBy: "boofbrain"
  }
];
