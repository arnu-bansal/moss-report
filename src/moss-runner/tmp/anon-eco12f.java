public class BubbleSort {
 
    // Function to implement bubble sort
    public static void bubbleSort(int[] arr) {
        int n = arr.length; // Get the length of the array
        for (int i = 0; i < n - 1; i++) { // Outer loop for number of passes
            for (int j = 0; j < n - 1 - i; j++) { // Inner loop for each pass
                if (arr[j] > arr[j + 1]) { // Compare adjacent elements
                    // Swap arr[j] and arr[j + 1]
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
 
    // Main method to test the bubble sort function
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90}; // Sample array
        System.out.println("Original array:");
        for (int num : arr) {
            System.out.print(num + " ");
        }
        System.out.println();
 
        bubbleSort(arr); // Call bubble sort function
 
        System.out.println("Sorted array:");
        for (int num : arr) {
            System.out.print(num + " ");
        }
    }
}