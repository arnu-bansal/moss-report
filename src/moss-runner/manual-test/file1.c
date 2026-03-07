#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct deck {
    long long a;
    long long b;
    int count;
    struct deck* left;
    struct deck* right;
}deck;

deck* create(long long a, long long b) {
    deck* new = (deck*)malloc(sizeof(deck));
    new->a = a;
    new->b = b;
    new->count = 1;
    new->left = NULL;
    new->right = NULL;
    return new;
}

deck* insert(deck* head, long long a, long long b) {
    if (head == NULL) return create(a, b);
    if (head->a == a && head->b == b) { head->count++; return head; }
    else if (head->a+head->b < a+b || (head->a+head->b == a+b && head->a < a)) head->right = insert(head->right, a, b);
    else head->left = insert(head->left, a, b);
    return head;
}

deck* biggest(deck* node) {
    while (node && node->right) node = node->right;
    return node;
}

deck* delete(deck* head, long long a, long long b) {
    if (head == NULL) return head;
    if (head->a+head->b < a+b || (head->a+head->b == a+b && head->a < a)) head->right = delete(head->right, a, b);
    else if (head->a+head->b > a+b || (head->a+head->b == a+b && head->a > a)) head->left = delete(head->left, a, b);
    else {
        if (head->a == a && head->b == b) {
            if (head->count > 1) { head->count--; return head; }
            else {
                if (head->left == NULL) { deck* temp = head->right; free(head); return temp; }
                else if (head->right == NULL) { deck* temp = head->left; free(head); return temp; }
                deck* temp = biggest(head->left);
                head->a = temp->a; head->b = temp->b; head->count = temp->count;
                temp->count = 1;
                head->left = delete(head->left, temp->a, temp->b);
                return head;
            }
        }
    }
    return head;
}

deck* search(deck* head, long long a, long long b) {
    if (head == NULL) return NULL;
    if (head->a == a && head->b == b) return head;
    else if (head->a+head->b < a+b || (head->a+head->b == a+b && head->a < a)) return search(head->right, a, b);
    else return search(head->left, a, b);
    return NULL;
}

deck* pred(deck* head, long long a, long long b) {
    deck* predecessor = NULL;
    deck* curr = head;
    while (curr != NULL) {
        if ((curr->a+curr->b < a+b) || (curr->a+curr->b == a+b && curr->a < a)) { predecessor = curr; curr = curr->right; }
        else curr = curr->left;
    }
    return predecessor;
}

deck* succ(deck* head, long long a, long long b) {
    deck* successor = NULL;
    deck* curr = head;
    while (curr != NULL) {
        if ((curr->a+curr->b > a+b) || (curr->a+curr->b == a+b && curr->a > a)) { successor = curr; curr = curr->left; }
        else curr = curr->right;
    }
    return successor;
}

void printt(deck* head) {
    if (head == NULL) return;
    printt(head->right);
    printf("%lld %lld %d\n", head->a, head->b, head->count);
    printt(head->left);
}

int countnodes(deck* head) {
    if (head == NULL) return 0;
    return 1 + countnodes(head->left) + countnodes(head->right);
}

int main() {
    int n; scanf("%d", &n);
    deck* head = NULL;
    for (int i=0; i<n; i++) { long long a,b; scanf("%lld %lld", &a, &b); head = insert(head, a, b); }
    int q; scanf("%d", &q);
    for (int i=0; i<q; i++) {
        long long a1,b1,a2,b2; char str[10]; scanf("%s", str);
        if (strcmp(str, "TRADE") == 0) {
            scanf("%lld %lld %lld %lld", &a1, &b1, &a2, &b2);
            if (a2 == -1 && b2 == -1) { printf("1\n"); head = insert(head, a1, b1); }
            else {
                deck* node = search(head, a2, b2);
                if (node == NULL || node->count == 1) printf("0\n");
                else {
                    deck* node1 = search(head, a1, b1);
                    if (node1 == NULL) { head = insert(head, a1, b1); head = delete(head, a2, b2); printf("1\n"); }
                    else {
                        if ((a1+b1 > a2+b2) || (a1+b1 == a2+b2 && a1 > a2)) { head = insert(head, a1, b1); head = delete(head, a2, b2); printf("1\n"); }
                        else printf("0\n");
                    }
                }
            }
        } else {
            long long a1,b1; scanf("%lld %lld", &a1, &b1);
            deck* card = search(head, a1, b1);
            if (card != NULL) {
                printf("%d\n", card->count);
                deck* p = pred(head, a1, b1);
                deck* s = succ(head, a1, b1);
                if (p == NULL) printf("-1\n"); else printf("%lld %lld %d\n", p->a, p->b, p->count);
                if (s == NULL) printf("-1\n"); else printf("%lld %lld %d\n", s->a, s->b, s->count);
            } else printf("0\n-1\n-1\n");
        }
    }
    printf("%d\n", countnodes(head));
    printt(head);
    return 0;
}