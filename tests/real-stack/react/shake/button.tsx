// Only Button: what it adds over the baseline is what @blip/react costs a page that uses one component.
import { createRoot } from "react-dom/client";
import { Button } from "@blip/react";

createRoot(document.getElementById("root")!).render(<Button type="button">Press start</Button>);
