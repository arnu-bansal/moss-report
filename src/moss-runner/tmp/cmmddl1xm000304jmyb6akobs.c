#include<stdio.h>
#include<stdlib.h>
#include<stdbool.h>

typedef struct pair{
    long int start;
    long int end;
    long int idx;
}pair;

typedef struct interEnd{
    long int end;
    long int idx;
}interEnd;

void merge(pair arr[], long int l, long int m, long int r){
    long int n1=m-l+1;
    long int n2=r-m;

    pair left[n1], right[n2];
    for(long int i=0;i<n1;i++){
        left[i]=arr[i+l];
    }
    for(long int j=0;j<n2;j++){
        right[j]=arr[m+j+1];
    }

    long int i=0,j=0,k=l;
    while(i<n1 && j<n2){
        if(left[i].start < right[j].start){
            arr[k++]=left[i++];
        }else if(left[i].start==right[j].start && left[i].end > right[j].end){
            arr[k++]=left[i++];   
        }else{
            arr[k++]=right[j++];
        }
    }

    while(i<n1) arr[k++]=left[i++];
    while(j<n2) arr[k++]=right[j++];
}

void mergesort(pair arr[], long int l, long int r){
    if(l<r){
        long int m=l+(r-l)/2;
        mergesort(arr,l,m);
        mergesort(arr,m+1,r);

        merge(arr,l,m,r);
    }
}

void containsmerge(interEnd arr[], long int l, long int m, long int r,long int containsInt[]){
    long int n1=m-l+1;
    long int n2=r-m;

    interEnd left[n1], right[n2];
    for(long int i=0;i<n1;i++){
        left[i]=arr[i+l];
    }
    for(long int j=0;j<n2;j++){
        right[j]=arr[m+1+j];
    }

    long int i=0,j=0,k=l;
    while(i<n1 && j<n2){
        if(left[i].end <= right[j].end){
            containsInt[left[i].idx]+=j;
            arr[k++]=left[i++];
        }else{
            arr[k++]=right[j++];
        }
    }

    while(i<n1){
        containsInt[left[i].idx]+=j;
        arr[k++]=left[i++];
    }
    while(j<n2) arr[k++]=right[j++];
}

void containsmergesort(interEnd arr[], long int l, long int r, long int containsInt[]){
    if(l<r){
        long int m=l+(r-l)/2;
        containsmergesort(arr,l,m,containsInt);
        containsmergesort(arr,m+1,r,containsInt);

        containsmerge(arr,l,m,r,containsInt);
    }
}

void containedmerge(interEnd arr[], long int l, long int m, long int r,long int containedInt[]){
    long int n1=m-l+1;
    long int n2=r-m;

    interEnd left[n1], right[n2];
    for(long int i=0;i<n1;i++){
        left[i]=arr[i+l];
    }
    for(long int j=0;j<n2;j++){
        right[j]=arr[m+1+j];
    }

    long int i=0,j=0,k=l;
    while(i<n1 && j<n2){
        if(left[i].end < right[j].end){
            arr[k++]=left[i++];
        }else{
            containedInt[right[j].idx]+=n1-i;
            arr[k++]=right[j++];
        }
    }

    while(i<n1) arr[k++]=left[i++];
    while(j<n2) arr[k++]=right[j++];
}

void containedmergesort(interEnd arr[], long int l, long int r, long int containedInt[]){
    if(l<r){
        long int m=l+(r-l)/2;
        containedmergesort(arr,l,m,containedInt);
        containedmergesort(arr,m+1,r,containedInt);

        containedmerge(arr,l,m,r,containedInt);
    }
}

int main(){
    int t;
    scanf("%d\n", &t);

    while(t>0){
        long int n;
        scanf("%ld\n", &n);
        pair arr[n];
        long int L,U;
        for(long int i=0;i<n;i++){
            scanf("%ld %ld\n", &L, &U);
            arr[i].start=L;
            arr[i].end=U;
            arr[i].idx=i;
        }

        mergesort(arr,0,n-1);
        long int containsInt[n];
        long int containedInt[n];

        interEnd endpair[n];
        for(long int i=0;i<n;i++){
            containsInt[i]=0;
            endpair[i].end=arr[i].end;
            endpair[i].idx=i;
        }
        containsmergesort(endpair,0,n-1,containsInt);

        for(long int i=0;i<n;i++){
            containedInt[i]=0;
            endpair[i].end=arr[i].end;
            endpair[i].idx=i;
        }
        containedmergesort(endpair,0,n-1,containedInt);

        long int score[n];
        for(long int i=0;i<n;i++){
            score[arr[i].idx]=n+containsInt[i]-containedInt[i]-1; 
        }

        for(long int i=0;i<n;i++){
            printf("%ld ", score[i]);
        }
        printf("\n");
        
        t--;
    }

    return 0;
}