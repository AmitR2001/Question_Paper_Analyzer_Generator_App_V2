def match_objectives_to_question(objectives, question):
    matched = []
    for obj in objectives.split("\n"):
        if any(word in question for word in obj.split()):
            matched.append(obj)
    return matched