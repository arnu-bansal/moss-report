#include <stdio.h>

void readMatrix(int r, int c, int mat[r][c]) {
    for(int i = 0; i < r; i++) {
        for(int j = 0; j < c; j++) {
            scanf("%d", &mat[i][j]);
        }
    }
}

void multiply(int n, int m, int p, int A[n][m], int B[m][p], int C[n][p]) {
    for(int i = 0; i < n; i++) {
        for(int j = 0; j < p; j++) {
            C[i][j] = 0;
            for(int k = 0; k < m; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
}

void printMatrix(int r, int c, int mat[r][c]) {
    for(int i = 0; i < r; i++) {
        for(int j = 0; j < c; j++) {
            printf("%d ", mat[i][j]);
        }
        printf("\n");
    }
}

int main() {
    int n, m, p;

    scanf("%d %d %d", &n, &m, &p);

    int A[n][m];
    int B[m][p];
    int C[n][p];

    readMatrix(n, m, A);
    readMatrix(m, p, B);

    multiply(n, m, p, A, B, C);

    printMatrix(n, p, C);

    return 0;
}