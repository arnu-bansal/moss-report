#include <stdio.h>

void inputMatrix(int rows, int cols, int arr[rows][cols]) {
    for(int i = 0; i < rows; i++) {
        for(int j = 0; j < cols; j++) {
            scanf("%d", &arr[i][j]);
        }
    }
}

void multiplyMatrices(int r1, int c1, int c2,
                      int mat1[r1][c1],
                      int mat2[c1][c2],
                      int res[r1][c2]) {

    for(int i = 0; i < r1; i++) {
        for(int j = 0; j < c2; j++) {

            int sum = 0;

            for(int k = 0; k < c1; k++) {
                sum += mat1[i][k] * mat2[k][j];
            }

            res[i][j] = sum;
        }
    }
}

void display(int r, int c, int mat[r][c]) {
    for(int i = 0; i < r; i++) {
        for(int j = 0; j < c; j++) {
            printf("%d ", mat[i][j]);
        }
        printf("\n");
    }
}

int main() {

    int r1, c1, c2;

    scanf("%d %d %d", &r1, &c1, &c2);

    int mat1[r1][c1];
    int mat2[c1][c2];
    int result[r1][c2];

    inputMatrix(r1, c1, mat1);
    inputMatrix(c1, c2, mat2);

    multiplyMatrices(r1, c1, c2, mat1, mat2, result);

    display(r1, c2, result);

    return 0;
}