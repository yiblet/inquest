import inquest

# here's an example of setting up inquest on a hello world program
# at it's core all you have to do is just run inquest.enable


def main():
    inquest.enable(api_key="YOUR API KEY HERE", glob=["*.py"])
    # that's it! you there's nothing else to do

    # inquest is now idling in the background and it will listen
    # to changes you make on the dashboard and setup log
    # statements as you add them
    print("hello world")


if __name__ == "__main__":
    main()
