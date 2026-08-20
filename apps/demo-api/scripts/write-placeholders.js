const fs = require("fs");
const path = require("path");

/** Minimal valid JPEG (neutral gray tile) for local demo placeholders. */
const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBEQACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAADAAECBAUGB//EAD0QAAIBAwMCBAMFBgcBQEBAAECAwAEEQUSITFBEyJRYQYycRQjgZGhscEVUtHwI0Lh8RYz/8QAGQEBAQEBAQEAAAAAAAAAAAAAAAECAwQF/8QAJREBAQEAAgIDAQEAAgMBAAAAAAERAhIhMQMTQVEEFGEyUnEi/9oADAMBAAIRAxEAPwD3+iiigD//2Q==",
  "base64",
);

const targets = [
  path.join(
    "C:/Users/Ibrahima Djogo/Desktop/immobilier/public/images/properties/property-placeholder.jpg",
  ),
  path.join(
    "C:/Users/Ibrahima Djogo/Desktop/immo/public/images/properties/property-placeholder.jpg",
  ),
];

for (const file of targets) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, TINY_JPEG);
  console.log("wrote", file, fs.statSync(file).size, "bytes");
}
