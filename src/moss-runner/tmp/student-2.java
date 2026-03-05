import java.util.Scanner;
public class Sort {
    static int[] data;
    static int size;

    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        size = input.nextInt();
        data = new int[size];
        for (int i = 0; i < size; i++) {
            data[i] = input.nextInt();
        }
        sort();
        for (int i = 0; i < size; i++) {
            System.out.print(data[i] + " ");
        }
    }

    static void sort() {
        for (int i = 0; i < size - 1; i++) {
            for (int j = 0; j < size - i - 1; j++) {
                if (data[j] > data[j + 1]) {
                    int tmp = data[j];
                    data[j] = data[j + 1];
                    data[j + 1] = tmp;
                }
            }
        }
    }
}