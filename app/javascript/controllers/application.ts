import { Application } from "@hotwired/stimulus";

const application = Application.start();

declare global {
  var Stimulus: any;
}

// Configure Stimulus development experience
application.debug = false;
window.Stimulus = application;

export { application };
