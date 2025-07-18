package ku.cs.cs01418321project;

import javafx.application.Application;
import javafx.scene.image.Image;
import javafx.scene.text.Font;
import javafx.stage.Stage;
import ku.cs.Main;
import ku.cs.services.FXRouter;

import java.io.IOException;

public class MainApplication extends Application {
    @Override
    public void start(Stage stage) throws IOException {

        FXRouter.bind(this, stage, "ShipLink", 1024, 768);

        //Image image = new Image(getClass().getResource("/images/logo.png").toString());
        //stage.getIcons().add(image);
        stage.setResizable(false);
        configRoutes();
        
        //FXRouter.goTo("login");
    }

    private void configRoutes() {
        String viewPath = "ku/cs/views/";
        //FXRouter.when("login", viewPath + "login.fxml");
    }

    public static void main(String[] args) {
        launch();
    }
}