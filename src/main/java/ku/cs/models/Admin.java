package ku.cs.models;

public class Admin extends User {
    private final String role;

    public Admin(int id, String name, String surname, String email, String phone, String password) {
        super(id, name, surname, email, phone, password);
        this.role = "Admin";
    }

    public Admin getAdmin() {
        return this;
    }

    public String getRole() {
        return role;
    }
}
