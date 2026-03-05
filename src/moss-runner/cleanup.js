const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function cleanup() {
  // Delete all anon submissions and keep only student-1,2,3
  const anons = await prisma.submission.findMany({
    where: { userId: { startsWith: "anon-" } }
  });
  for (const s of anons) {
    await prisma.submissionVersion.deleteMany({ where: { submissionId: s.id } });
    await prisma.submission.delete({ where: { id: s.id } });
    console.log("Deleted:", s.userId);
  }
  // Also fix student code with proper newlines
  const code1 = `public class BubbleSort {
    static int[] arr;
    static int n;

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        n = sc.nextInt();
        arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        bubbleSort();
        for (int i = 0; i < n; i++) {
            System.out.print(arr[i] + " ");
        }
    }

    static void bubbleSort() {
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}`;

  const code2 = `import java.util.Scanner;
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
}`;

  await prisma.submissionVersion.updateMany({ where: { submissionId: "sub-student1" }, data: { code: code1 } });
  await prisma.submissionVersion.updateMany({ where: { submissionId: "sub-student2" }, data: { code: code2 } });
  console.log("Fixed student code.");
  await prisma.$disconnect();
  console.log("Done!");
}

cleanup();
