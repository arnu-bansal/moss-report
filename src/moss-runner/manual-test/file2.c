#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
    long long att;
    long long def;
    int freq;
    struct Node* left;
    struct Node* right;
} Node;

Node* creatNode(long long x, long long y) {
    Node* new = (Node*)malloc(sizeof(Node));
    new->att = x; new->def = y; new->freq = 1;
    new->left = NULL; new->right = NULL;
    return new;
}

Node* createTree(long long x, long long y, Node* root) {
    if (root == NULL) return creatNode(x, y);
    if (x == root->att && y == root->def) {
        root->freq++;
    } else if ((x + y > root->att + root->def) || (x + y == root->att + root->def && x > root->att)) {
        root->right = createTree(x, y, root->right);
    } else {
        root->left = createTree(x, y, root->left);
    }
    return root;
}

void inorder(Node* root) {
    if (root == NULL) return;
    inorder(root->right);
    printf("%lld %lld %d\n", root->att, root->def, root->freq);
    inorder(root->left);
}

Node* search(Node* root, long long a, long long b) {
    if (root == NULL || (root->att == a && root->def == b)) return root;
    if ((a + b > root->att + root->def) || (a + b == root->att + root->def && a > root->att))
        return search(root->right, a, b);
    return search(root->left, a, b);
}

Node* max(Node* root) {
    if (root == NULL) return NULL;
    while (root->right != NULL) root = root->right;
    return root;
}

Node* predecessor(Node* root, long long x, long long y) {
    Node* pred = NULL;
    while (root != NULL) {
        if ((root->att + root->def < x + y) || (root->att + root->def == x + y && root->att < x)) {
            pred = root; root = root->right;
        } else root = root->left;
    }
    return pred;
}

Node* successor(Node* root, long long x, long long y) {
    Node* succ = NULL;
    while (root != NULL) {
        if ((root->att + root->def > x + y) || (root->att + root->def == x + y && root->att > x)) {
            succ = root; root = root->left;
        } else root = root->right;
    }
    return succ;
}

Node* delete(Node* root, long long x, long long y) {
    if (root == NULL) return NULL;
    if (root->att == x && root->def == y) {
        if (root->freq > 1) {
            root->freq--; return root;
        } else if (root->left == NULL) {
            Node* temp = root->right; free(root); return temp;
        } else if (root->right == NULL) {
            Node* temp = root->left; free(root); return temp;
        } else {
            Node* temp = max(root->left);
            root->att = temp->att; root->def = temp->def; root->freq = temp->freq;
            temp->freq = 1; // Your brilliant fix
            root->left = delete(root->left, temp->att, temp->def);
            return root;
        }
    }
    if ((x + y < root->att + root->def) || (x + y == root->att + root->def && x < root->att))
        root->left = delete(root->left, x, y);
    else
        root->right = delete(root->right, x, y);
    return root;
}

int num(Node* root) {
    if (root == NULL) return 0;
    return 1 + num(root->left) + num(root->right);
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Node* root = NULL;
    for (int i = 0; i < n; i++) {
        long long a, b;
        scanf("%lld %lld", &a, &b);
        root = createTree(a, b, root);
    }

    int q;
    scanf("%d", &q);
    while (q--) {
        char arr[15];
        scanf("%s", arr);
        if (strcmp(arr, "TRADE") == 0) {
            long long a1, d1, a2, d2;
            scanf("%lld %lld %lld %lld", &a1, &d1, &a2, &d2);
            if (a2 == -1 && d2 == -1) {
                root = createTree(a1, d1, root); printf("1\n");
            } else {
                Node* target = search(root, a2, d2);
                if (target == NULL || target->freq == 1) printf("0\n");
                else {
                    // Check if new card is stronger than old card
                    if ((a1 + d1 > a2 + d2) || (a1 + d1 == a2 + d2 && a1 > a2)) {
                        root = createTree(a1, d1, root);
                        root = delete(root, a2, d2);
                        printf("1\n");
                    } else printf("0\n");
                }
            }
        } 
        else {
            long long x, y;
            scanf("%lld %lld", &x, &y);
            Node* pus = search(root, x, y);
            if (pus == NULL) printf("0\n-1\n-1\n");
            else {
                printf("%d\n", pus->freq);
                Node* t1 = predecessor(root, x, y);
                Node* t2 = successor(root, x, y);
                if (t1 == NULL) printf("-1\n"); else printf("%lld %lld %d\n", t1->att, t1->def, t1->freq);
                if (t2 == NULL) printf("-1\n"); else printf("%lld %lld %d\n", t2->att, t2->def, t2->freq);
            }
        }
    }
    printf("%d\n", num(root));
    inorder(root);
    return 0;
}