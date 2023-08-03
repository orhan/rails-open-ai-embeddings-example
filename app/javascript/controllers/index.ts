// Import and register all your controllers from the importmap under controllers/*

import { application } from "./application";
import HelloController from "./hello_controller";

application.start();
Stimulus.register("hello", HelloController);
