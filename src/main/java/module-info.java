module ku.cs {
    requires javafx.controls;
    requires javafx.fxml;
    requires java.desktop;
    requires javafx.swing;


    opens ku.cs.cs01418321project to javafx.fxml;
    exports ku.cs.cs01418321project;
    exports ku.cs.controllers;
    opens ku.cs.controllers to javafx.fxml;
    opens ku.cs.models to javafx.base;
}