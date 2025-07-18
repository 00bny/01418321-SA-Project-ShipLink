package ku.cs.services;

import java.time.format.DateTimeFormatter;

public interface Datasource<T> {
    DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    T readData();
    void writeData(T data);
}
