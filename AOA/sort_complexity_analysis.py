import time
import random
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from copy import deepcopy

def insertion_sort(arr):

    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1

        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1

        arr[j + 1] = key

    return arr

def selection_sort(arr):

    n = len(arr)

    for i in range(n):

        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j

        arr[i], arr[min_idx] = arr[min_idx], arr[i]

    return arr

def generate_random_array(n, seed=None):

    if seed is not None:
        random.seed(seed)

    return [random.randint(1, 10000) for _ in range(n)]

def measure_sort_time(sort_func, arr):

    arr_copy = deepcopy(arr)

    start_time = time.perf_counter()
    sort_func(arr_copy)
    end_time = time.perf_counter()

    return end_time - start_time

def run_empirical_analysis(input_sizes, num_runs=10):

    insertion_avg_times = []
    selection_avg_times = []

    print("Running empirical analysis...")
    print(f"Input sizes: {input_sizes}")
    print(f"Number of runs per size: {num_runs}\n")

    for n in input_sizes:
        print(f"Testing with n = {n}...")

        insertion_times = []
        selection_times = []

        for run in range(num_runs):

            test_array = generate_random_array(n, seed=None)

            insertion_time = measure_sort_time(insertion_sort, test_array)
            insertion_times.append(insertion_time)

            test_array = generate_random_array(n, seed=None)
            selection_time = measure_sort_time(selection_sort, test_array)
            selection_times.append(selection_time)

        avg_insertion = sum(insertion_times) / len(insertion_times)
        avg_selection = sum(selection_times) / len(selection_times)

        insertion_avg_times.append(avg_insertion)
        selection_avg_times.append(avg_selection)

        print(f"  Average Insertion Sort time: {avg_insertion:.6f} seconds")
        print(f"  Average Selection Sort time: {avg_selection:.6f} seconds")
        print()

    return input_sizes, insertion_avg_times, selection_avg_times

def plot_results(input_sizes, insertion_times, selection_times):

    plt.figure(figsize=(10, 6))

    plt.plot(input_sizes, insertion_times, 'o-', label='Insertion Sort', linewidth=2, markersize=8)
    plt.plot(input_sizes, selection_times, 's-', label='Selection Sort', linewidth=2, markersize=8)

    plt.xlabel('Input Size (n)', fontsize=12)
    plt.ylabel('Average Execution Time (seconds)', fontsize=12)

    plt.title('Empirical Time Complexity: Insertion Sort vs Selection Sort', fontsize=14, fontweight='bold')

    plt.legend(fontsize=11)
    plt.grid(True, alpha=0.3, linestyle='--')

    plt.tight_layout()

    output_file = 'sort_complexity_plot.png'
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"\nGraph saved to: {output_file}")
    plt.close()

def main():

    input_sizes = [100, 200, 400, 800, 1600, 3200]

    num_runs = 10

    sizes, insertion_times, selection_times = run_empirical_analysis(input_sizes, num_runs)

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"{'n':<10} {'Insertion Sort (s)':<20} {'Selection Sort (s)':<20}")
    print("-"*60)
    for i, n in enumerate(sizes):
        print(f"{n:<10} {insertion_times[i]:<20.6f} {selection_times[i]:<20.6f}")
    print("="*60)

    plot_results(sizes, insertion_times, selection_times)

if __name__ == "__main__":
    main()
